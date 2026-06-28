#!/usr/bin/env php
<?php

require_once __DIR__ . '/../src/config/config.php';
require_once __DIR__ . '/../src/config/database.php';

$db = Database::connect();

echo "<pre>\n";

// Ver ejercicio id 1
$stmt = $db->query("SELECT * FROM exercises WHERE id = 1");
$ex = $stmt->fetch();
echo "Ejercicio id=1:\n";
echo $ex ? json_encode($ex, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) : "NO EXISTE\n";

echo "\n\n--- Todos los block_exercises que referencian ejercicios inexistentes ---\n";
$stmt = $db->query("
    SELECT be.id, be.block_id, be.exercise_id, be.sub_block, b.name as block_name
    FROM block_exercises be
    LEFT JOIN exercises e ON e.id = be.exercise_id
    LEFT JOIN blocks b ON b.id = be.block_id
    WHERE e.id IS NULL
");
$orphans = $stmt->fetchAll();
if (empty($orphans)) {
    echo "No hay referencias huérfanas.\n";
} else {
    foreach ($orphans as $o) {
        echo "block_exercise id={$o['id']} | bloque='{$o['block_name']}' | sub={$o['sub_block']} | exercise_id={$o['exercise_id']}\n";
    }
}

echo "\n\n--- Primeros 10 ejercicios de la biblioteca ---\n";
$stmt = $db->query("SELECT id, canonical_name FROM exercises ORDER BY id LIMIT 10");
foreach ($stmt->fetchAll() as $e) {
    echo "id={$e['id']} | {$e['canonical_name']}\n";
}

echo "</pre>\n";
