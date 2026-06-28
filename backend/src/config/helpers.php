<?php

function json_response(mixed $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function json_error(string $message, int $status = 400): void {
    json_response(['error' => $message], $status);
}

function get_body(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

function get_auth_user(): ?array {
    // Tras el rewrite de .htaccess, la cabecera puede llegar con prefijo REDIRECT_
    $header = $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? '';
    if (!str_starts_with($header, 'Bearer ')) return null;
    $token = substr($header, 7);
    return JWT::decode($token);
}

function require_auth(): array {
    $user = get_auth_user();
    if (!$user) json_error('Unauthorized', 401);
    return $user;
}

function require_admin(): array {
    $user = require_auth();
    if ($user['role'] !== 'admin') json_error('Forbidden', 403);
    return $user;
}

function paginate(PDO $db, string $sql, array $params = [], int $page = 1, int $limit = 20): array {
    $offset = ($page - 1) * $limit;

    // Total
    $countSql = "SELECT COUNT(*) as total FROM ({$sql}) as sub";
    $stmt = $db->prepare($countSql);
    $stmt->execute($params);
    $total = (int) $stmt->fetch()['total'];

    // Datos
    $stmt = $db->prepare("$sql LIMIT :limit OFFSET :offset");
    foreach ($params as $k => $v) $stmt->bindValue($k, $v);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $data = $stmt->fetchAll();

    return [
        'data'       => $data,
        'total'      => $total,
        'page'       => $page,
        'limit'      => $limit,
        'last_page'  => (int) ceil($total / $limit),
    ];
}
