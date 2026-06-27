<?php

class SessionController {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    // GET /api/sessions
    public function list(): void {
        $auth = require_auth();
        $page = (int)($_GET['page'] ?? 1);

        $sql = 'SELECT s.id, s.session_date, s.type, s.general_notes, s.created_at, b.name as block_name, b.id as block_id FROM sessions s LEFT JOIN blocks b ON b.id = s.block_id WHERE s.user_id = :uid ORDER BY s.session_date DESC';

        $result = paginate($this->db, $sql, [':uid' => $auth['id']], $page);

        json_response($result);
    }

    // GET /api/sessions/:id
    public function get(int $id): void {
        $auth = require_auth();

        $stmt = $this->db->prepare('SELECT s.*, b.name as block_name FROM sessions s LEFT JOIN blocks b ON b.id = s.block_id WHERE s.id = ? AND s.user_id = ?');
        $stmt->execute([$id, $auth['id']]);
        $session = $stmt->fetch();

        if (!$session) json_error('Session not found', 404);

        $session['exercises'] = $this->getSessionExercises($id);

        json_response($session);
    }

    // POST /api/sessions
    public function create(): void {
        $auth = require_auth();
        $body = get_body();

        $date = $body['session_date'] ?? date('Y-m-d');
        $type = $body['type'] ?? 'block';

        if (!in_array($type, ['block', 'group'])) json_error('Invalid session type');

        // Si es bloque, buscar el bloque activo en esa fecha si no se especifica
        $blockId = $body['block_id'] ?? null;
        if ($type === 'block' && !$blockId) {
            $stmt = $this->db->prepare('SELECT id FROM blocks WHERE start_date <= ? ORDER BY start_date DESC LIMIT 1');
            $stmt->execute([$date]);
            $block   = $stmt->fetch();
            $blockId = $block ? $block['id'] : null;
        }

        $stmt = $this->db->prepare('INSERT INTO sessions (user_id, block_id, session_date, type, general_notes) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$auth['id'], $blockId, $date, $type, $body['general_notes'] ?? null]);
        $id = (int)$this->db->lastInsertId();

        json_response($this->getById($id, $auth['id']), 201);
    }

    // PUT /api/sessions/:id
    public function update(int $id): void {
        $auth = require_auth();
        $body = get_body();

        // Verificar que es sesión del usuario
        $stmt = $this->db->prepare('SELECT id FROM sessions WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $auth['id']]);
        if (!$stmt->fetch()) json_error('Session not found', 404);

        $fields = [];
        $params = [];

        if (isset($body['general_notes'])) { $fields[] = 'general_notes = ?'; $params[] = $body['general_notes']; }
        if (isset($body['session_date']))  { $fields[] = 'session_date = ?';  $params[] = $body['session_date']; }

        if (!empty($fields)) {
            $fields[]  = 'updated_at = CURRENT_TIMESTAMP';
            $params[]  = $id;
            $this->db->prepare('UPDATE sessions SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
        }

        json_response($this->getById($id, $auth['id']));
    }

    // DELETE /api/sessions/:id
    public function delete(int $id): void {
        $auth = require_auth();

        $stmt = $this->db->prepare('DELETE FROM sessions WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $auth['id']]);

        if ($stmt->rowCount() === 0) json_error('Session not found', 404);

        json_response(['message' => 'Session deleted']);
    }

    // POST /api/sessions/:id/exercises — registrar ejercicio en sesión
    public function addExercise(int $sessionId): void {
        $auth = require_auth();
        $body = get_body();

        // Verificar sesión
        $stmt = $this->db->prepare('SELECT id FROM sessions WHERE id = ? AND user_id = ?');
        $stmt->execute([$sessionId, $auth['id']]);
        if (!$stmt->fetch()) json_error('Session not found', 404);

        $exerciseId = $body['exercise_id'] ?? null;
        if (!$exerciseId) json_error('exercise_id is required');

        $stmt = $this->db->prepare('INSERT INTO session_exercises (session_id, exercise_id, block_exercise_id, sets_done, reps_done, weight_kg, rpe, adaptation, notes, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $sessionId,
            $exerciseId,
            $body['block_exercise_id'] ?? null,
            $body['sets_done']         ?? null,
            $body['reps_done']         ?? null,
            $body['weight_kg']         ?? null,
            $body['rpe']               ?? null,
            $body['adaptation']        ?? null,
            $body['notes']             ?? null,
            $body['order_index']       ?? 0,
        ]);
        $seId = (int)$this->db->lastInsertId();

        json_response($this->getSessionExerciseById($seId), 201);
    }

    // PUT /api/sessions/:id/exercises/:seId
    public function updateExercise(int $sessionId, int $seId): void {
        $auth = require_auth();

        // Verificar pertenencia
        $stmt = $this->db->prepare('SELECT se.id FROM session_exercises se JOIN sessions s ON s.id = se.session_id WHERE se.id = ? AND s.user_id = ?');
        $stmt->execute([$seId, $auth['id']]);
        if (!$stmt->fetch()) json_error('Not found', 404);

        $body   = get_body();
        $fields = [];
        $params = [];

        foreach (['sets_done','reps_done','weight_kg','rpe','adaptation','notes','order_index'] as $f) {
            if (isset($body[$f])) { $fields[] = "$f = ?"; $params[] = $body[$f]; }
        }

        if (!empty($fields)) {
            $params[] = $seId;
            $this->db->prepare('UPDATE session_exercises SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
        }

        json_response($this->getSessionExerciseById($seId));
    }

    // DELETE /api/sessions/:id/exercises/:seId
    public function deleteExercise(int $sessionId, int $seId): void {
        $auth = require_auth();

        $stmt = $this->db->prepare('DELETE FROM session_exercises WHERE id = ? AND session_id IN (SELECT id FROM sessions WHERE user_id = ?)');
        $stmt->execute([$seId, $auth['id']]);

        if ($stmt->rowCount() === 0) json_error('Not found', 404);

        json_response(['message' => 'Exercise removed from session']);
    }

    // POST /api/sessions/:id/exercises/:seId/media
    public function addExerciseMedia(int $sessionId, int $seId): void {
        $auth    = require_auth();
        $type    = $_POST['type'] ?? 'photo';
        $caption = $_POST['caption'] ?? null;
        $allowed = $type === 'video' ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
        $path    = handle_upload('file', $allowed);

        if (!$path) json_error('No file uploaded');

        $stmt = $this->db->prepare('INSERT INTO session_exercise_media (session_exercise_id, type, url, caption) VALUES (?, ?, ?, ?)');
        $stmt->execute([$seId, $type, $path, $caption]);

        json_response(['id' => $this->db->lastInsertId(), 'url' => $path, 'type' => $type], 201);
    }

    // DELETE /api/sessions/:id/exercises/:seId/media/:mediaId
    public function deleteExerciseMedia(int $sessionId, int $seId, int $mediaId): void {
        require_auth();

        $stmt = $this->db->prepare('SELECT url FROM session_exercise_media WHERE id = ? AND session_exercise_id = ?');
        $stmt->execute([$mediaId, $seId]);
        $media = $stmt->fetch();

        if (!$media) json_error('Media not found', 404);

        delete_upload($media['url']);
        $this->db->prepare('DELETE FROM session_exercise_media WHERE id = ?')->execute([$mediaId]);

        json_response(['message' => 'Media deleted']);
    }

    // Helpers privados
    private function getSessionExercises(int $sessionId): array {
        $stmt = $this->db->prepare('
            SELECT se.*, e.canonical_name, e.muscle_group
            FROM session_exercises se
            JOIN exercises e ON e.id = se.exercise_id
            WHERE se.session_id = ?
            ORDER BY se.order_index
        ');
        $stmt->execute([$sessionId]);
        $exercises = $stmt->fetchAll();

        foreach ($exercises as &$ex) {
            $stmt = $this->db->prepare('SELECT id, type, url, caption FROM session_exercise_media WHERE session_exercise_id = ?');
            $stmt->execute([$ex['id']]);
            $ex['media'] = $stmt->fetchAll();
        }

        return $exercises;
    }

    private function getSessionExerciseById(int $id): array {
        $stmt = $this->db->prepare('SELECT se.*, e.canonical_name FROM session_exercises se JOIN exercises e ON e.id = se.exercise_id WHERE se.id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    private function getById(int $id, int $userId): array {
        $stmt = $this->db->prepare('SELECT s.*, b.name as block_name FROM sessions s LEFT JOIN blocks b ON b.id = s.block_id WHERE s.id = ? AND s.user_id = ?');
        $stmt->execute([$id, $userId]);
        $session = $stmt->fetch();
        $session['exercises'] = $this->getSessionExercises($id);
        return $session;
    }
}
