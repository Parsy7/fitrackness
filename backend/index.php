<?php

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Inicializar base de datos si no existe
require_once __DIR__ . '/src/config/config.php';
require_once __DIR__ . '/src/config/database.php';

if (!file_exists(DB_PATH)) {
    Database::init();
}

// Router
require_once __DIR__ . '/src/routes/api.php';
