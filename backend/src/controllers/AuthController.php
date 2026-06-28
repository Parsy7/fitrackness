<?php

class AuthController {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    public function login(): void {
        $body = get_body();
        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';

        if (!$email || !$password) {
            json_error('Email and password are required');
        }

        $stmt = $this->db->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            json_error('Invalid credentials', 401);
        }

        $token = JWT::encode([
            'id'   => $user['id'],
            'role' => $user['role'],
            'name' => $user['name'],
        ]);

        json_response([
            'token' => $token,
            'user'  => [
                'id'    => $user['id'],
                'name'  => $user['name'],
                'email' => $user['email'],
                'role'  => $user['role'],
            ],
        ]);
    }

    public function me(): void {
        $auth = require_auth();

        $stmt = $this->db->prepare('SELECT id, name, email, role, age, birth_date, sex, height_cm, weight_kg, conditions, avatar_url, created_at FROM users WHERE id = ?');
        $stmt->execute([$auth['id']]);
        $user = $stmt->fetch();

        if (!$user) json_error('User not found', 404);

        $user['conditions'] = json_decode($user['conditions'] ?? '[]', true);
        json_response($user);
    }

    public function register(): void {
        // Solo el admin puede crear usuarios
        require_admin();

        $body = get_body();
        $name     = trim($body['name'] ?? '');
        $email    = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';
        $role     = $body['role'] ?? 'user';

        if (!$name || !$email || !$password) {
            json_error('Name, email and password are required');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_error('Invalid email');
        }

        if (!in_array($role, ['admin', 'user'])) {
            json_error('Invalid role');
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);

        try {
            $stmt = $this->db->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
            $stmt->execute([$name, $email, $hash, $role]);
            $id = $this->db->lastInsertId();

            json_response(['id' => $id, 'name' => $name, 'email' => $email, 'role' => $role], 201);
        } catch (PDOException $e) {
            if (str_contains($e->getMessage(), 'UNIQUE')) {
                json_error('Email already in use', 409);
            }
            json_error('Error creating user', 500);
        }
    }
}
