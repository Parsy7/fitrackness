<?php

class ExerciseController {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    // GET /api/exercises
    public function list(): void {
        require_auth();

        $search = $_GET['search'] ?? '';
        $group  = $_GET['muscle_group'] ?? '';
        $page   = (int)($_GET['page'] ?? 1);
        $limit  = min((int)($_GET['limit'] ?? 20), 2000); // máximo 2000

        $where  = [];
        $params = [];

        if ($search) {
            $where[]  = '(e.canonical_name LIKE :search OR EXISTS (SELECT 1 FROM exercise_aliases ea WHERE ea.exercise_id = e.id AND ea.alias LIKE :search))';
            $params[':search'] = '%' . $search . '%';
        }

        if ($group) {
            $where[]  = 'e.muscle_group = :group';
            $params[':group'] = $group;
        }

        $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $sql = "SELECT e.id, e.canonical_name, e.description, e.muscle_group, e.equipment, e.adaptations, e.created_at FROM exercises e $whereSql ORDER BY e.canonical_name";

        $result = paginate($this->db, $sql, $params, $page, $limit);

        foreach ($result['data'] as &$ex) {
            $ex['adaptations'] = json_decode($ex['adaptations'] ?? '[]', true);
            $ex['aliases']     = $this->getAliases($ex['id']);
            $ex['media']       = $this->getMedia($ex['id']);
        }

        json_response($result);
    }

    // GET /api/exercises/:id
    public function get(int $id): void {
        require_auth();

        $stmt = $this->db->prepare('SELECT * FROM exercises WHERE id = ?');
        $stmt->execute([$id]);
        $ex = $stmt->fetch();

        if (!$ex) json_error('Exercise not found', 404);

        $ex['adaptations'] = json_decode($ex['adaptations'] ?? '[]', true);
        $ex['aliases']     = $this->getAliases($id);
        $ex['media']       = $this->getMedia($id);

        json_response($ex);
    }

    // POST /api/exercises (admin)
    public function create(): void {
        require_admin();
        $body = get_body();

        $name = trim($body['canonical_name'] ?? '');
        if (!$name) json_error('canonical_name is required');

        try {
            $stmt = $this->db->prepare('INSERT INTO exercises (canonical_name, description, muscle_group, equipment, adaptations) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([
                $name,
                $body['description'] ?? null,
                $body['muscle_group'] ?? null,
                $body['equipment'] ?? null,
                json_encode($body['adaptations'] ?? []),
            ]);
            $id = (int)$this->db->lastInsertId();

            // Insertar aliases si vienen
            if (!empty($body['aliases'])) {
                $this->syncAliases($id, $body['aliases']);
            }

            json_response($this->getById($id), 201);
        } catch (PDOException $e) {
            if (str_contains($e->getMessage(), 'UNIQUE')) {
                json_error('Exercise name already exists', 409);
            }
            json_error('Error creating exercise', 500);
        }
    }

    // PUT /api/exercises/:id (admin)
    public function update(int $id): void {
        require_admin();
        $body = get_body();

        $fields = [];
        $params = [];

        if (isset($body['canonical_name']))  { $fields[] = 'canonical_name = ?';  $params[] = trim($body['canonical_name']); }
        if (isset($body['description']))     { $fields[] = 'description = ?';     $params[] = $body['description']; }
        if (isset($body['muscle_group']))    { $fields[] = 'muscle_group = ?';    $params[] = $body['muscle_group']; }
        if (isset($body['equipment']))       { $fields[] = 'equipment = ?';       $params[] = $body['equipment']; }
        if (isset($body['adaptations']))     { $fields[] = 'adaptations = ?';     $params[] = json_encode($body['adaptations']); }

        if (!empty($fields)) {
            $fields[]  = 'updated_at = CURRENT_TIMESTAMP';
            $params[]  = $id;
            $sql = 'UPDATE exercises SET ' . implode(', ', $fields) . ' WHERE id = ?';
            $this->db->prepare($sql)->execute($params);
        }

        if (isset($body['aliases'])) {
            $this->syncAliases($id, $body['aliases']);
        }

        json_response($this->getById($id));
    }

    // DELETE /api/exercises/:id (admin)
    public function delete(int $id): void {
        require_admin();

        $stmt = $this->db->prepare('DELETE FROM exercises WHERE id = ?');
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) json_error('Exercise not found', 404);

        json_response(['message' => 'Exercise deleted']);
    }

    // POST /api/exercises/:id/media (admin)
    public function addMedia(int $id): void {
        require_admin();

        $type    = $_POST['type'] ?? 'photo';
        $caption = $_POST['caption'] ?? null;
        $allowed = $type === 'video' ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES;
        $path    = handle_upload('file', $allowed);

        if (!$path) json_error('No file uploaded');

        $stmt = $this->db->prepare('INSERT INTO exercise_media (exercise_id, type, url, caption) VALUES (?, ?, ?, ?)');
        $stmt->execute([$id, $type, $path, $caption]);

        json_response(['id' => $this->db->lastInsertId(), 'url' => $path, 'type' => $type], 201);
    }

    // DELETE /api/exercises/:id/media/:mediaId (admin)
    public function deleteMedia(int $id, int $mediaId): void {
        require_admin();

        $stmt = $this->db->prepare('SELECT url FROM exercise_media WHERE id = ? AND exercise_id = ?');
        $stmt->execute([$mediaId, $id]);
        $media = $stmt->fetch();

        if (!$media) json_error('Media not found', 404);

        delete_upload($media['url']);

        $this->db->prepare('DELETE FROM exercise_media WHERE id = ?')->execute([$mediaId]);

        json_response(['message' => 'Media deleted']);
    }

    // Helpers privados
    private function getAliases(int $exerciseId): array {
        $stmt = $this->db->prepare('SELECT id, alias FROM exercise_aliases WHERE exercise_id = ? ORDER BY alias');
        $stmt->execute([$exerciseId]);
        return $stmt->fetchAll();
    }

    private function getMedia(int $exerciseId): array {
        $stmt = $this->db->prepare('SELECT id, type, url, caption FROM exercise_media WHERE exercise_id = ? ORDER BY id');
        $stmt->execute([$exerciseId]);
        return $stmt->fetchAll();
    }

    private function syncAliases(int $exerciseId, array $aliases): void {
        $this->db->prepare('DELETE FROM exercise_aliases WHERE exercise_id = ?')->execute([$exerciseId]);
        $stmt = $this->db->prepare('INSERT INTO exercise_aliases (exercise_id, alias) VALUES (?, ?)');
        foreach ($aliases as $alias) {
            $alias = trim($alias);
            if ($alias) $stmt->execute([$exerciseId, $alias]);
        }
    }

    private function getById(int $id): array {
        $stmt = $this->db->prepare('SELECT * FROM exercises WHERE id = ?');
        $stmt->execute([$id]);
        $ex = $stmt->fetch();
        $ex['adaptations'] = json_decode($ex['adaptations'] ?? '[]', true);
        $ex['aliases']     = $this->getAliases($id);
        $ex['media']       = $this->getMedia($id);
        return $ex;
    }
}
