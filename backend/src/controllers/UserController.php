<?php

class UserController {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    // PUT /api/users/profile — el usuario actualiza su propio perfil (datos JSON)
    public function updateProfile(): void {
        $auth = require_auth();
        $body = get_body();

        $fields = [];
        $params = [];

        if (isset($body['name']))       { $fields[] = 'name = ?';       $params[] = trim($body['name']); }
        if (isset($body['height_cm']))  { $fields[] = 'height_cm = ?';  $params[] = (float)$body['height_cm']; }
        if (isset($body['weight_kg']))  { $fields[] = 'weight_kg = ?';  $params[] = (float)$body['weight_kg']; }
        if (isset($body['conditions'])) { $fields[] = 'conditions = ?'; $params[] = json_encode($body['conditions']); }
        if (isset($body['sex']))        { $fields[] = 'sex = ?';        $params[] = $body['sex']; }

        // birth_date: si viene, calcular edad automáticamente
        if (isset($body['birth_date']) && $body['birth_date']) {
            $fields[] = 'birth_date = ?';
            $params[] = $body['birth_date'];
            // Calcular edad
            $birth = new DateTime($body['birth_date']);
            $today = new DateTime();
            $age   = $today->diff($birth)->y;
            $fields[] = 'age = ?';
            $params[] = $age;
        } elseif (isset($body['age']) && $body['age'] !== '') {
            // Solo se permite editar age manualmente si NO hay birth_date guardada
            $stmt = $this->db->prepare('SELECT birth_date FROM users WHERE id = ?');
            $stmt->execute([$auth['id']]);
            $row = $stmt->fetch();
            if (empty($row['birth_date'])) {
                $fields[] = 'age = ?';
                $params[] = (int)$body['age'];
            }
        }

        if (isset($body['password']) && $body['password']) {
            $fields[] = 'password_hash = ?';
            $params[] = password_hash($body['password'], PASSWORD_BCRYPT);
        }

        if (empty($fields)) json_error('No fields to update');

        $fields[] = 'updated_at = CURRENT_TIMESTAMP';
        $params[] = $auth['id'];

        $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $this->db->prepare($sql)->execute($params);

        json_response(['message' => 'Profile updated']);
    }

    // POST /api/users/avatar — subir foto de perfil
    public function uploadAvatar(): void {
        $auth = require_auth();
        $path = handle_upload('file', ALLOWED_IMAGE_TYPES);
        if (!$path) json_error('No image uploaded');

        // Borrar avatar anterior si existe
        $stmt = $this->db->prepare('SELECT avatar_url FROM users WHERE id = ?');
        $stmt->execute([$auth['id']]);
        $user = $stmt->fetch();
        if (!empty($user['avatar_url'])) delete_upload($user['avatar_url']);

        $this->db->prepare('UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            ->execute([$path, $auth['id']]);

        json_response(['avatar_url' => $path]);
    }

    // DELETE /api/users/avatar — eliminar foto de perfil
    public function deleteAvatar(): void {
        $auth = require_auth();

        $stmt = $this->db->prepare('SELECT avatar_url FROM users WHERE id = ?');
        $stmt->execute([$auth['id']]);
        $user = $stmt->fetch();

        if (!empty($user['avatar_url'])) delete_upload($user['avatar_url']);

        $this->db->prepare('UPDATE users SET avatar_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            ->execute([$auth['id']]);

        json_response(['message' => 'Avatar deleted']);
    }

    // GET /api/admin/users — lista todos los usuarios (admin)
    public function listUsers(): void {
        require_admin();

        $page   = (int)($_GET['page'] ?? 1);
        $sql    = 'SELECT id, name, email, role, age, birth_date, sex, height_cm, weight_kg, conditions, avatar_url, created_at FROM users ORDER BY name';
        $result = paginate($this->db, $sql, [], $page);

        foreach ($result['data'] as &$u) {
            $u['conditions'] = json_decode($u['conditions'] ?? '[]', true);
        }

        json_response($result);
    }

    // GET /api/admin/users/:id — detalle de un usuario (admin)
    public function getUser(int $id): void {
        require_admin();

        $stmt = $this->db->prepare('SELECT id, name, email, role, age, birth_date, sex, height_cm, weight_kg, conditions, avatar_url, created_at FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $user = $stmt->fetch();

        if (!$user) json_error('User not found', 404);

        $user['conditions'] = json_decode($user['conditions'] ?? '[]', true);

        $stmt = $this->db->prepare('SELECT s.id, s.session_date, s.type, b.name as block_name FROM sessions s LEFT JOIN blocks b ON b.id = s.block_id WHERE s.user_id = ? ORDER BY s.session_date DESC LIMIT 5');
        $stmt->execute([$id]);
        $user['recent_sessions'] = $stmt->fetchAll();

        json_response($user);
    }

    // DELETE /api/admin/users/:id — eliminar usuario (admin)
    public function deleteUser(int $id): void {
        require_admin();

        $stmt = $this->db->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) json_error('User not found', 404);

        json_response(['message' => 'User deleted']);
    }
}
