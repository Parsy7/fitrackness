<?php

class StatsController {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    // GET /api/stats/overview — resumen general del usuario
    public function overview(): void {
        $auth = require_auth();
        $uid  = $auth['id'];

        // Total sesiones
        $stmt = $this->db->prepare('SELECT COUNT(*) as total FROM sessions WHERE user_id = ?');
        $stmt->execute([$uid]);
        $totalSessions = (int)$stmt->fetch()['total'];

        // Sesiones este mes
        $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM sessions WHERE user_id = ? AND strftime('%Y-%m', session_date) = strftime('%Y-%m', 'now')");
        $stmt->execute([$uid]);
        $sessionsThisMonth = (int)$stmt->fetch()['total'];

        // Total ejercicios registrados
        $stmt = $this->db->prepare('SELECT COUNT(*) as total FROM session_exercises se JOIN sessions s ON s.id = se.session_id WHERE s.user_id = ?');
        $stmt->execute([$uid]);
        $totalExercises = (int)$stmt->fetch()['total'];

        // PRs totales
        $stmt = $this->db->prepare('SELECT COUNT(*) as total FROM personal_records WHERE user_id = ?');
        $stmt->execute([$uid]);
        $totalPRs = (int)$stmt->fetch()['total'];

        // Últimas 8 semanas de actividad
        $stmt = $this->db->prepare("
            SELECT strftime('%Y-%W', session_date) as week, COUNT(*) as sessions
            FROM sessions
            WHERE user_id = ? AND session_date >= DATE('now', '-56 days')
            GROUP BY week
            ORDER BY week
        ");
        $stmt->execute([$uid]);
        $weeklyActivity = $stmt->fetchAll();

        json_response([
            'total_sessions'      => $totalSessions,
            'sessions_this_month' => $sessionsThisMonth,
            'total_exercises'     => $totalExercises,
            'total_prs'           => $totalPRs,
            'weekly_activity'     => $weeklyActivity,
        ]);
    }

    // GET /api/stats/exercise/:id — evolución de un ejercicio
    public function exerciseProgress(int $exerciseId): void {
        $auth = require_auth();

        $stmt = $this->db->prepare('SELECT canonical_name FROM exercises WHERE id = ?');
        $stmt->execute([$exerciseId]);
        $exercise = $stmt->fetch();
        if (!$exercise) json_error('Exercise not found', 404);

        $stmt = $this->db->prepare("
            SELECT s.session_date, se.weight_kg, se.sets_done, se.reps_done, se.rpe, se.notes
            FROM session_exercises se
            JOIN sessions s ON s.id = se.session_id
            WHERE s.user_id = ? AND se.exercise_id = ? AND se.weight_kg IS NOT NULL
            ORDER BY s.session_date ASC
        ");
        $stmt->execute([$auth['id'], $exerciseId]);
        $history = $stmt->fetchAll();

        // PR actual
        $stmt = $this->db->prepare('SELECT weight_kg, reps, achieved_at FROM personal_records WHERE user_id = ? AND exercise_id = ?');
        $stmt->execute([$auth['id'], $exerciseId]);
        $pr = $stmt->fetch();

        json_response([
            'exercise'      => $exercise['canonical_name'],
            'history'       => $history,
            'personal_record' => $pr ?: null,
        ]);
    }

    // GET /api/stats/prs — todos los PRs del usuario
    public function personalRecords(): void {
        $auth = require_auth();

        $stmt = $this->db->prepare('
            SELECT pr.weight_kg, pr.reps, pr.achieved_at, e.id as exercise_id, e.canonical_name
            FROM personal_records pr
            JOIN exercises e ON e.id = pr.exercise_id
            WHERE pr.user_id = ?
            ORDER BY pr.achieved_at DESC
        ');
        $stmt->execute([$auth['id']]);

        json_response($stmt->fetchAll());
    }

    // GET /api/stats/volume — volumen por semana
    public function volume(): void {
        $auth  = require_auth();
        $weeks = (int)($_GET['weeks'] ?? 12);

        $stmt = $this->db->prepare("
            SELECT
                strftime('%Y-%W', s.session_date) as week,
                SUM(se.sets_done * CAST(REPLACE(se.reps_done, ',', '+') AS REAL) * COALESCE(se.weight_kg, 0)) as volume
            FROM session_exercises se
            JOIN sessions s ON s.id = se.session_id
            WHERE s.user_id = ? AND s.session_date >= DATE('now', '-' || ? || ' days')
            GROUP BY week
            ORDER BY week
        ");
        $stmt->execute([$auth['id'], $weeks * 7]);

        json_response($stmt->fetchAll());
    }

    // POST /api/stats/check-pr — comprobar y actualizar PR tras registrar ejercicio
    public function checkAndUpdatePR(int $userId, int $exerciseId, float $weight, string $reps, string $date, int $sessionId): bool {
        $stmt = $this->db->prepare('SELECT id, weight_kg FROM personal_records WHERE user_id = ? AND exercise_id = ?');
        $stmt->execute([$userId, $exerciseId]);
        $current = $stmt->fetch();

        if (!$current || $weight > (float)$current['weight_kg']) {
            if ($current) {
                $this->db->prepare('UPDATE personal_records SET weight_kg = ?, reps = ?, achieved_at = ?, session_id = ? WHERE id = ?')
                    ->execute([$weight, $reps, $date, $sessionId, $current['id']]);
            } else {
                $this->db->prepare('INSERT INTO personal_records (user_id, exercise_id, weight_kg, reps, achieved_at, session_id) VALUES (?, ?, ?, ?, ?, ?)')
                    ->execute([$userId, $exerciseId, $weight, $reps, $date, $sessionId]);
            }
            return true; // Es PR nuevo
        }
        return false;
    }

    // GET /api/admin/stats/users — resumen de actividad de todos los usuarios (admin)
    public function adminUsersOverview(): void {
        require_admin();

        $stmt = $this->db->query("
            SELECT u.id, u.name, u.email,
                COUNT(s.id) as total_sessions,
                MAX(s.session_date) as last_session
            FROM users u
            LEFT JOIN sessions s ON s.user_id = u.id
            WHERE u.role = 'user'
            GROUP BY u.id
            ORDER BY last_session DESC
        ");

        json_response($stmt->fetchAll());
    }
}
