#!/usr/bin/env php
<?php

require_once __DIR__ . '/../src/config/config.php';
require_once __DIR__ . '/../src/config/database.php';

$db = Database::connect();

echo "<pre>\n";

// Bloque activo
$stmt = $db->prepare('SELECT id, name FROM blocks WHERE start_date <= DATE("now") ORDER BY start_date DESC LIMIT 1');
$stmt->execute();
$block = $stmt->fetch();
echo "Bloque activo: {$block['name']} (id:{$block['id']})\n\n";

// Complementos directos
$stmt = $db->prepare("SELECT * FROM block_complements WHERE block_id = ?");
$stmt->execute([$block['id']]);
$comps = $stmt->fetchAll();
echo "Complementos en BD: " . count($comps) . "\n";
foreach ($comps as $c) {
    echo "  id:{$c['id']} sub:{$c['sub_block']} method:{$c['methodology']} param:{$c['parameter']}\n";

    $stmt2 = $db->prepare("SELECT bce.*, e.canonical_name FROM block_complement_exercises bce JOIN exercises e ON e.id = bce.exercise_id WHERE bce.complement_id = ?");
    $stmt2->execute([$c['id']]);
    foreach ($stmt2->fetchAll() as $ex) {
        echo "    - {$ex['canonical_name']} reps:{$ex['reps']}\n";
    }
}

echo "\n--- Query getBlockComplements ---\n";
$stmt = $db->prepare("
    SELECT bc.*, GROUP_CONCAT(bce.exercise_id || '|' || e.canonical_name || '|' || COALESCE(bce.reps,'') || '|' || COALESCE(bce.notes,'') || '|' || bce.order_index, ';;') as exercises_raw
    FROM block_complements bc
    LEFT JOIN block_complement_exercises bce ON bce.complement_id = bc.id
    LEFT JOIN exercises e ON e.id = bce.exercise_id
    WHERE bc.block_id = ?
    GROUP BY bc.id
    ORDER BY bc.sub_block, bc.order_index
");
$stmt->execute([$block['id']]);
$rows = $stmt->fetchAll();
echo "Filas devueltas: " . count($rows) . "\n";
foreach ($rows as $r) {
    echo "  sub:{$r['sub_block']} method:{$r['methodology']} exercises_raw:" . substr($r['exercises_raw'] ?? 'NULL', 0, 80) . "\n";
}

echo "</pre>\n";
