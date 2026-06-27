<?php

class UserController {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    // PUT /api/users/profile — el usuario actualiza su propio perfil
    public function updateProfile(): void {
        $auth = require_auth();
        $body = get_body();

        $fields = [];
        $params = [];

        if (isset($body['name']))       { $fields[] = 'name = ?';       $params[] = trim($body['name']); }
        if (isset($body['age']))        { $fields[] = 'age = ?';        $params[] = (int)$body['age']; }
        if (isset($body['height_cm']))  { $fields[] = 'height_cm = ?';  $params[] = (float)$body['height_cm']; }
        if (isset($body['weight_kg']))  { $fields[] = 'weight_kg = ?';  $params[] = (float)$body['weight_kg']; }
        if (isset($body['conditions'])) { $fields[] = 'conditions = ?'; $params[] = json_encode($body['conditions']); }

        if (isset($body['password']) && $body['password']) {
            $fields[] = 'password_hash = ?';
            $params[] = password_hash($body['password'], PASSWORD_BCRYPT);
        }

        if (empty($fields)) json_error('No fields to update');

        $fields[]  = 'updated_at = CURRENT_TIMESTAMP';
        $params[]  = $auth['id'];

        $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $this->db->prepare($sql)->execute($params);

        json_response(['message' => 'Profile updated']);
    }

    // GET /api/admin/users — lista todos los usuarios (admin)
    public function listUsers(): void {
        require_admin();

        $page  = (int)($_GET['page'] ?? 1);
        $sql   = 'SELECT id, name, email, role, age, height_cm, weight_kg, conditions, created_at FROM users ORDER BY name';
        $result = paginate($this->db, $sql, [], $page);

        foreach ($result['data'] as &$u) {
            $u['conditions'] = json_decode($u['conditions'] ?? '[]', true);
        }

        json_response($result);
    }

    // GET /api/admin/users/:id — detalle de un usuario (admin)
    public function getUser(int $id): void {
        require_admin();

        $stmt = $this->db->prepare('SELECT id, name, email, role, age, height_cm, weight_kg, conditions, created_at FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $user = $stmt->fetch();

        if (!$user) json_error('User not found', 404);

        $user['conditions'] = json_decode($user['conditions'] ?? '[]', true);

        // Últimas 5 sesiones
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
