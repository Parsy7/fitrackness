#!/usr/bin/env php
<?php

/**
 * Migración: añadir last_name a la tabla users
 * Uso: php migrate_002_user_lastname.php
 */

require_once __DIR__ . '/../src/config/config.php';
require_once __DIR__ . '/../src/config/database.php';

$db = Database::connect();

echo "Aplicando migración 002 — user last_name...\n";

$columns = $db->query("PRAGMA table_info(users)")->fetchAll(PDO::FETCH_COLUMN, 1);

if (in_array('last_name', $columns)) {
    echo "→ Columna 'last_name' ya existe, omitiendo\n";
} else {
    $db->exec("ALTER TABLE users ADD COLUMN last_name TEXT");
    echo "✓ Columna 'last_name' añadida\n";
}

echo "\n✅ Migración completada.\n";
