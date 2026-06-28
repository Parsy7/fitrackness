<?php

class BlockController {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    // GET /api/blocks
    public function list(): void {
        require_auth();

        $stmt = $this->db->query('SELECT id, name, start_date, notes, created_at FROM blocks ORDER BY start_date DESC');
        $blocks = $stmt->fetchAll();

        foreach ($blocks as &$b) {
            $b['exercises'] = $this->getBlockExercises($b['id']);
        }

        json_response($blocks);
    }

    // GET /api/blocks/active — bloque activo hoy
    public function active(): void {
        require_auth();

        $stmt = $this->db->prepare('SELECT id, name, start_date, notes FROM blocks WHERE start_date <= DATE("now") ORDER BY start_date DESC LIMIT 1');
        $stmt->execute();
        $block = $stmt->fetch();

        if (!$block) json_error('No active block found', 404);

        $block['exercises'] = $this->getBlockExercises($block['id']);
        json_response($block);
    }

    // GET /api/blocks/:id
    public function get(int $id): void {
        require_auth();

        $stmt = $this->db->prepare('SELECT * FROM blocks WHERE id = ?');
        $stmt->execute([$id]);
        $block = $stmt->fetch();

        if (!$block) json_error('Block not found', 404);

        $block['exercises'] = $this->getBlockExercises($id);
        json_response($block);
    }

    // POST /api/blocks (admin)
    public function create(): void {
        require_admin();
        $body = get_body();

        $name       = trim($body['name'] ?? '');
        $start_date = $body['start_date'] ?? date('Y-m-d');

        if (!$name) json_error('name is required');

        $stmt = $this->db->prepare('INSERT INTO blocks (name, start_date, notes) VALUES (?, ?, ?)');
        $stmt->execute([$name, $start_date, $body['notes'] ?? null]);
        $id = (int)$this->db->lastInsertId();

        if (!empty($body['exercises'])) {
            $this->syncExercises($id, $body['exercises']);
        }

        json_response($this->getById($id), 201);
    }

    // PUT /api/blocks/:id (admin)
    public function update(int $id): void {
        require_admin();
        $body = get_body();

        $fields = [];
        $params = [];

        if (isset($body['name']))       { $fields[] = 'name = ?';       $params[] = trim($body['name']); }
        if (isset($body['start_date'])) { $fields[] = 'start_date = ?'; $params[] = $body['start_date']; }
        if (isset($body['notes']))      { $fields[] = 'notes = ?';      $params[] = $body['notes']; }

        if (!empty($fields)) {
            $fields[]  = 'updated_at = CURRENT_TIMESTAMP';
            $params[]  = $id;
            $sql = 'UPDATE blocks SET ' . implode(', ', $fields) . ' WHERE id = ?';
            $this->db->prepare($sql)->execute($params);
        }

        if (isset($body['exercises'])) {
            $this->syncExercises($id, $body['exercises']);
        }

        json_response($this->getById($id));
    }

    // DELETE /api/blocks/:id (admin)
    public function delete(int $id): void {
        require_admin();

        $stmt = $this->db->prepare('DELETE FROM blocks WHERE id = ?');
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) json_error('Block not found', 404);

        json_response(['message' => 'Block deleted']);
    }

    // POST /api/blocks/import-image (admin) — importar bloque desde imagen con IA
    public function importFromImage(): void {
        require_admin();

        $path = handle_upload('image', ALLOWED_IMAGE_TYPES);
        if (!$path) json_error('No image uploaded');

        $fullPath = UPLOAD_DIR . $path;
        $imageData = base64_encode(file_get_contents($fullPath));
        $mimeType  = mime_content_type($fullPath);

        // Obtener todos los ejercicios con sus aliases para el mapeo
        $stmt = $this->db->query('SELECT e.id, e.canonical_name, GROUP_CONCAT(ea.alias, "|") as aliases FROM exercises e LEFT JOIN exercise_aliases ea ON ea.exercise_id = e.id GROUP BY e.id');
        $existingExercises = $stmt->fetchAll();

        $exerciseList = array_map(fn($e) => [
            'id'            => $e['id'],
            'canonical_name'=> $e['canonical_name'],
            'aliases'       => $e['aliases'] ? explode('|', $e['aliases']) : [],
        ], $existingExercises);

        $prompt = "Analiza esta imagen de un panel de ejercicios de gimnasio y extrae todos los ejercicios con sus parámetros.

La imagen puede contener sub-bloques (A, B, C, D) con ejercicios, series, repeticiones y tiempos de descanso.

Devuelve SOLO un JSON válido con esta estructura exacta, sin texto adicional:
{
  \"sub_blocks\": [
    {
      \"name\": \"A\",
      \"exercises\": [
        {
          \"name\": \"nombre del ejercicio tal como aparece\",
          \"sets\": número o null,
          \"reps\": \"string con reps ej: 8, 8-10, 10/8/6\" o null,
          \"rest_seconds\": número en segundos o null,
          \"notes\": \"notas adicionales si las hay\" o null
        }
      ],
      \"complementos\": \"texto de la sección complementos si existe\" o null
    }
  ]
}

Lista de ejercicios ya existentes en la base de datos para mapeo:
" . json_encode($exerciseList);

        // Llamada a Claude API
        $response = $this->callClaudeVision($imageData, $mimeType, $prompt);

        // Limpiar archivo temporal de imagen
        delete_upload($path);

        if (!$response) json_error('La IA no devolvió respuesta', 500);

        // Limpiar posibles fences de markdown ```json ... ```
        $clean = trim($response);
        $clean = preg_replace('/^```(?:json)?/', '', $clean);
        $clean = preg_replace('/```$/', '', $clean);
        $clean = trim($clean);

        // Intentar parsear JSON
        $extracted = json_decode($clean, true);
        if (!$extracted) json_error('No se pudo interpretar la respuesta de la IA: ' . substr($clean, 0, 200), 500);

        // Mapear ejercicios con los existentes
        $result = $this->mapExercises($extracted, $exerciseList);

        json_response($result);
    }

    // POST /api/blocks/import-confirm (admin) — confirmar importación tras revisión
    public function importConfirm(): void {
        require_admin();
        $body = get_body();

        $name       = trim($body['name'] ?? '');
        $start_date = $body['start_date'] ?? date('Y-m-d');
        $sub_blocks = $body['sub_blocks'] ?? [];

        if (!$name) json_error('Block name is required');

        $this->db->beginTransaction();

        try {
            // Crear bloque
            $stmt = $this->db->prepare('INSERT INTO blocks (name, start_date) VALUES (?, ?)');
            $stmt->execute([$name, $start_date]);
            $blockId = (int)$this->db->lastInsertId();

            $order = 0;
            foreach ($sub_blocks as $sub) {
                $subName = $sub['name'] ?? null;
                foreach ($sub['exercises'] as $ex) {
                    $exerciseId = $ex['exercise_id'] ?? null;

                    // Si es nuevo, crearlo
                    if (!$exerciseId && !empty($ex['canonical_name'])) {
                        $stmt = $this->db->prepare('INSERT INTO exercises (canonical_name) VALUES (?)');
                        $stmt->execute([trim($ex['canonical_name'])]);
                        $exerciseId = (int)$this->db->lastInsertId();

                        // Añadir el nombre original como alias si difiere
                        if (!empty($ex['original_name']) && $ex['original_name'] !== $ex['canonical_name']) {
                            $stmt = $this->db->prepare('INSERT INTO exercise_aliases (exercise_id, alias) VALUES (?, ?)');
                            $stmt->execute([$exerciseId, $ex['original_name']]);
                        }
                    }

                    if (!$exerciseId) continue;

                    // Si se añade un alias nuevo a ejercicio existente
                    if (!empty($ex['new_alias']) && !empty($ex['exercise_id'])) {
                        $stmt = $this->db->prepare('INSERT OR IGNORE INTO exercise_aliases (exercise_id, alias) VALUES (?, ?)');
                        $stmt->execute([$ex['exercise_id'], $ex['new_alias']]);
                    }

                    $stmt = $this->db->prepare('INSERT INTO block_exercises (block_id, exercise_id, sub_block, recommended_sets, recommended_reps, recommended_rest_seconds, notes, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
                    $stmt->execute([
                        $blockId,
                        $exerciseId,
                        $subName,
                        $ex['sets'] ?? null,
                        $ex['reps'] ?? null,
                        $ex['rest_seconds'] ?? null,
                        $ex['notes'] ?? null,
                        $order++,
                    ]);
                }
            }

            $this->db->commit();
            json_response($this->getById($blockId), 201);

        } catch (Exception $e) {
            $this->db->rollBack();
            json_error('Error creating block: ' . $e->getMessage(), 500);
        }
    }

    // Helpers privados
    private function getBlockExercises(int $blockId): array {
        $stmt = $this->db->prepare('
            SELECT be.id, be.sub_block, be.recommended_sets, be.recommended_reps,
                   be.recommended_rest_seconds, be.notes, be.order_index,
                   e.id as exercise_id, e.canonical_name, e.muscle_group, e.equipment
            FROM block_exercises be
            JOIN exercises e ON e.id = be.exercise_id
            WHERE be.block_id = ?
            ORDER BY be.sub_block, be.order_index
        ');
        $stmt->execute([$blockId]);
        return $stmt->fetchAll();
    }

    private function syncExercises(int $blockId, array $exercises): void {
        $this->db->prepare('DELETE FROM block_exercises WHERE block_id = ?')->execute([$blockId]);

        $stmt = $this->db->prepare('INSERT INTO block_exercises (block_id, exercise_id, sub_block, recommended_sets, recommended_reps, recommended_rest_seconds, notes, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

        foreach ($exercises as $i => $ex) {
            $stmt->execute([
                $blockId,
                $ex['exercise_id'],
                $ex['sub_block'] ?? null,
                $ex['recommended_sets'] ?? null,
                $ex['recommended_reps'] ?? null,
                $ex['recommended_rest_seconds'] ?? null,
                $ex['notes'] ?? null,
                $i,
            ]);
        }
    }

    private function mapExercises(array $extracted, array $existingExercises): array {
        foreach ($extracted['sub_blocks'] as &$sub) {
            foreach ($sub['exercises'] as &$ex) {
                $originalName = $ex['name'];
                $match        = $this->findMatch($originalName, $existingExercises);

                if ($match['status'] === 'found') {
                    $ex['status']      = 'found';
                    $ex['exercise_id'] = $match['exercise']['id'];
                    $ex['canonical_name'] = $match['exercise']['canonical_name'];
                } elseif ($match['status'] === 'possible') {
                    $ex['status']      = 'possible';
                    $ex['exercise_id'] = $match['exercise']['id'];
                    $ex['canonical_name'] = $match['exercise']['canonical_name'];
                    $ex['similarity']  = $match['similarity'];
                } else {
                    $ex['status']         = 'new';
                    $ex['exercise_id']    = null;
                    $ex['canonical_name'] = $originalName;
                }

                $ex['original_name'] = $originalName;
            }
        }

        return $extracted;
    }

    private function findMatch(string $name, array $exercises): array {
        $nameLower = strtolower(trim($name));

        // Búsqueda exacta por nombre canónico o alias
        foreach ($exercises as $ex) {
            if (strtolower($ex['canonical_name']) === $nameLower) {
                return ['status' => 'found', 'exercise' => $ex];
            }
            foreach ($ex['aliases'] as $alias) {
                if (strtolower($alias) === $nameLower) {
                    return ['status' => 'found', 'exercise' => $ex];
                }
            }
        }

        // Búsqueda por similitud (contiene o similar_text)
        $bestMatch   = null;
        $bestScore   = 0;

        foreach ($exercises as $ex) {
            $candidates = array_merge([$ex['canonical_name']], $ex['aliases']);
            foreach ($candidates as $candidate) {
                similar_text($nameLower, strtolower($candidate), $pct);
                if ($pct > $bestScore) {
                    $bestScore = $pct;
                    $bestMatch = $ex;
                }
            }
        }

        if ($bestScore >= 60) {
            return ['status' => 'possible', 'exercise' => $bestMatch, 'similarity' => round($bestScore)];
        }

        return ['status' => 'new'];
    }

    private function callClaudeVision(string $imageData, string $mimeType, string $prompt): ?string {
        if (!ANTHROPIC_API_KEY) {
            json_error('La clave de la API de Claude no está configurada en el servidor (ANTHROPIC_API_KEY)', 500);
        }

        $payload = [
            'model'      => ANTHROPIC_MODEL,
            'max_tokens' => 4096,
            'messages'   => [[
                'role'    => 'user',
                'content' => [
                    ['type' => 'image', 'source' => ['type' => 'base64', 'media_type' => $mimeType, 'data' => $imageData]],
                    ['type' => 'text',  'text'   => $prompt],
                ],
            ]],
        ];

        $ch = curl_init('https://api.anthropic.com/v1/messages');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_TIMEOUT        => 60,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'x-api-key: ' . ANTHROPIC_API_KEY,
                'anthropic-version: 2023-06-01',
            ],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr  = curl_error($ch);
        curl_close($ch);

        if ($curlErr) {
            json_error('Error de conexión con la API de Claude: ' . $curlErr, 500);
        }

        $data = json_decode($response, true);

        // Si la API devuelve un error, mostrarlo
        if ($httpCode !== 200) {
            $apiMsg = $data['error']['message'] ?? $response;
            json_error('La API de Claude devolvió un error (' . $httpCode . '): ' . $apiMsg, 500);
        }

        return $data['content'][0]['text'] ?? null;
    }

    private function getById(int $id): array {
        $stmt = $this->db->prepare('SELECT * FROM blocks WHERE id = ?');
        $stmt->execute([$id]);
        $block = $stmt->fetch();
        $block['exercises']   = $this->getBlockExercises($id);
        $block['complements'] = $this->getBlockComplements($id);
        return $block;
    }

    private function getBlockComplements(int $blockId): array {
        $stmt = $this->db->prepare("
            SELECT bc.*, GROUP_CONCAT(bce.exercise_id || '|' || e.canonical_name || '|' || COALESCE(bce.reps,'') || '|' || COALESCE(bce.notes,'') || '|' || bce.order_index, ';;') as exercises_raw
            FROM block_complements bc
            LEFT JOIN block_complement_exercises bce ON bce.complement_id = bc.id
            LEFT JOIN exercises e ON e.id = bce.exercise_id
            WHERE bc.block_id = ?
            GROUP BY bc.id
            ORDER BY bc.sub_block, bc.order_index
        ");
        $stmt->execute([$blockId]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $exs = [];
            if (!empty($row['exercises_raw'])) {
                foreach (explode(';;', $row['exercises_raw']) as $exStr) {
                    [$exId, $name, $reps, $notes, $order] = explode('|', $exStr);
                    if ($exId) $exs[] = ['exercise_id' => $exId, 'canonical_name' => $name, 'reps' => $reps ?: null, 'notes' => $notes ?: null, 'order_index' => (int)$order];
                }
                usort($exs, fn($a, $b) => $a['order_index'] - $b['order_index']);
            }
            $row['exercises'] = $exs;
            unset($row['exercises_raw']);
        }
        return $rows;
    }
}
