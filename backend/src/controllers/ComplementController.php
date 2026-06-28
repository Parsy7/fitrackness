<?php

class ComplementController {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    // GET /api/blocks/:id/complements
    public function listByBlock(int $blockId): void {
        require_auth();
        json_response($this->getByBlock($blockId));
    }

    // POST /api/blocks/:id/complements (admin)
    public function create(int $blockId): void {
        require_admin();
        $body = get_body();

        if (!trim($body['methodology'] ?? '')) json_error('methodology is required');
        if (!trim($body['sub_block']   ?? '')) json_error('sub_block is required');

        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("INSERT INTO block_complements (block_id, sub_block, methodology, parameter, notes, order_index) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $blockId,
                trim($body['sub_block']),
                trim($body['methodology']),
                $body['parameter'] ?? null,
                $body['notes']     ?? null,
                $body['order_index'] ?? 0,
            ]);
            $complementId = (int)$this->db->lastInsertId();

            // Insertar ejercicios del complemento
            if (!empty($body['exercises'])) {
                $this->syncExercises($complementId, $body['exercises']);
            }

            $this->db->commit();
            json_response($this->getById($complementId), 201);
        } catch (Exception $e) {
            $this->db->rollBack();
            json_error('Error creating complement: ' . $e->getMessage(), 500);
        }
    }

    // PUT /api/complements/:id (admin)
    public function update(int $id): void {
        require_admin();
        $body = get_body();

        $fields = [];
        $params = [];
        foreach (['sub_block','methodology','parameter','notes','order_index'] as $f) {
            if (isset($body[$f])) { $fields[] = "$f = ?"; $params[] = $body[$f]; }
        }

        if (!empty($fields)) {
            $params[] = $id;
            $this->db->prepare('UPDATE block_complements SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
        }

        if (isset($body['exercises'])) {
            $this->syncExercises($id, $body['exercises']);
        }

        json_response($this->getById($id));
    }

    // DELETE /api/complements/:id (admin)
    public function delete(int $id): void {
        require_admin();
        $stmt = $this->db->prepare('DELETE FROM block_complements WHERE id = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) json_error('Complement not found', 404);
        json_response(['message' => 'Complement deleted']);
    }

    // POST /api/sessions/:id/complements — registrar complemento en sesión
    public function registerInSession(int $sessionId): void {
        $auth = require_auth();
        $body = get_body();

        // Verificar que la sesión pertenece al usuario
        $stmt = $this->db->prepare('SELECT id FROM sessions WHERE id = ? AND user_id = ?');
        $stmt->execute([$sessionId, $auth['id']]);
        if (!$stmt->fetch()) json_error('Session not found', 404);

        $complementId = $body['complement_id'] ?? null;
        if (!$complementId) json_error('complement_id is required');

        // Upsert — si ya existe, actualizar
        $stmt = $this->db->prepare('SELECT id FROM session_complements WHERE session_id = ? AND complement_id = ?');
        $stmt->execute([$sessionId, $complementId]);
        $existing = $stmt->fetch();

        if ($existing) {
            $this->db->prepare('UPDATE session_complements SET done = ?, observations = ? WHERE id = ?')
                ->execute([$body['done'] ? 1 : 0, $body['observations'] ?? null, $existing['id']]);
        } else {
            $this->db->prepare('INSERT INTO session_complements (session_id, complement_id, done, observations) VALUES (?, ?, ?, ?)')
                ->execute([$sessionId, $complementId, $body['done'] ? 1 : 0, $body['observations'] ?? null]);
        }

        json_response(['message' => 'Complement registered']);
    }

    // GET /api/sessions/:id/complements
    public function getSessionComplements(int $sessionId): void {
        require_auth();
        $stmt = $this->db->prepare("
            SELECT sc.id, sc.complement_id, sc.done, sc.observations,
                   bc.methodology, bc.parameter, bc.sub_block, bc.notes as complement_notes
            FROM session_complements sc
            JOIN block_complements bc ON bc.id = sc.complement_id
            WHERE sc.session_id = ?
        ");
        $stmt->execute([$sessionId]);
        json_response($stmt->fetchAll());
    }

    // Helpers
    private function getByBlock(int $blockId): array {
        $stmt = $this->db->prepare('SELECT * FROM block_complements WHERE block_id = ? ORDER BY sub_block, order_index');
        $stmt->execute([$blockId]);
        $complements = $stmt->fetchAll();
        foreach ($complements as &$c) {
            $c['exercises'] = $this->getExercises($c['id']);
        }
        return $complements;
    }

    private function getById(int $id): array {
        $stmt = $this->db->prepare('SELECT * FROM block_complements WHERE id = ?');
        $stmt->execute([$id]);
        $c = $stmt->fetch();
        $c['exercises'] = $this->getExercises($id);
        return $c;
    }

    private function getExercises(int $complementId): array {
        $stmt = $this->db->prepare("
            SELECT bce.id, bce.reps, bce.notes, bce.order_index,
                   e.id as exercise_id, e.canonical_name, e.muscle_group
            FROM block_complement_exercises bce
            JOIN exercises e ON e.id = bce.exercise_id
            WHERE bce.complement_id = ?
            ORDER BY bce.order_index
        ");
        $stmt->execute([$complementId]);
        return $stmt->fetchAll();
    }

    private function syncExercises(int $complementId, array $exercises): void {
        $this->db->prepare('DELETE FROM block_complement_exercises WHERE complement_id = ?')->execute([$complementId]);
        $stmt = $this->db->prepare('INSERT INTO block_complement_exercises (complement_id, exercise_id, reps, notes, order_index) VALUES (?, ?, ?, ?, ?)');
        foreach ($exercises as $i => $ex) {
            if (empty($ex['exercise_id'])) continue;
            $stmt->execute([$complementId, $ex['exercise_id'], $ex['reps'] ?? null, $ex['notes'] ?? null, $i]);
        }
    }
}
