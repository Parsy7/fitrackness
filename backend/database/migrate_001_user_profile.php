#!/usr/bin/env php
<?php

/**
 * Migración: añadir birth_date, sex y avatar_url a la tabla users
 * Uso: php migrate_001_user_profile.php
 */

require_once __DIR__ . '/../src/config/config.php';
require_once __DIR__ . '/../src/config/database.php';

$db = Database::connect();

echo "Aplicando migración 001 — user profile fields...\n";

$columns = $db->query("PRAGMA table_info(users)")->fetchAll(PDO::FETCH_COLUMN, 1);

$migrations = [
    'birth_date' => "ALTER TABLE users ADD COLUMN birth_date DATE",
    'sex'        => "ALTER TABLE users ADD COLUMN sex TEXT CHECK(sex IN ('male','female','undisclosed'))",
    'avatar_url' => "ALTER TABLE users ADD COLUMN avatar_url TEXT",
];

foreach ($migrations as $col => $sql) {
    if (in_array($col, $columns)) {
        echo "→ Columna '$col' ya existe, omitiendo\n";
    } else {
        $db->exec($sql);
        echo "✓ Columna '$col' añadida\n";
    }
}

echo "\n✅ Migración completada.\n";
