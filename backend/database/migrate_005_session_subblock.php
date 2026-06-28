#!/usr/bin/env php
<?php

require_once __DIR__ . '/../src/config/config.php';
require_once __DIR__ . '/../src/config/database.php';

$db = Database::connect();

echo "<pre>\n";
echo "Migración 005 — añadir sub_block a sessions...\n\n";

$columns = $db->query("PRAGMA table_info(sessions)")->fetchAll(PDO::FETCH_COLUMN, 1);

if (in_array('sub_block', $columns)) {
    echo "→ Columna 'sub_block' ya existe.\n";
} else {
    $db->exec("ALTER TABLE sessions ADD COLUMN sub_block TEXT");
    echo "✓ Columna 'sub_block' añadida a sessions.\n";
}

echo "\n✅ Listo.\n";
echo "</pre>\n";
