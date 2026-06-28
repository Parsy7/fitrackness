#!/usr/bin/env php
<?php

require_once __DIR__ . '/../src/config/config.php';
require_once __DIR__ . '/../src/config/database.php';

$db = Database::connect();

echo "<pre>\n";

// Bloque activo
$stmt = $db->prepare('SELECT id, name, start_date FROM blocks WHERE start_date <= DATE("now") ORDER BY start_date DESC LIMIT 1');
$stmt->execute();
$block = $stmt->fetch();

if (!$block) {
    echo "No hay bloque activo\n";
    exit;
}

echo "Bloque activo: {$block['name']} (id: {$block['id']})\n\n";

// Ejercicios
$stmt = $db->prepare('SELECT COUNT(*) as total FROM block_exercises WHERE block_id = ?');
$stmt->execute([$block['id']]);
echo "Ejercicios en el bloque: " . $stmt->fetch()['total'] . "\n";

// Comprobar si existe la tabla block_complements
$tables = $db->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
echo "\nTablas existentes:\n";
foreach ($tables as $t) echo "  - $t\n";

echo "\n";

if (in_array('block_complements', $tables)) {
    $stmt = $db->prepare('SELECT COUNT(*) as total FROM block_complements WHERE block_id = ?');
    $stmt->execute([$block['id']]);
    echo "Complementos del bloque: " . $stmt->fetch()['total'] . "\n";
} else {
    echo "⚠️  La tabla block_complements NO existe — ejecuta migrate_006_complements.php\n";
}

// Probar la query de getBlockComplements
if (in_array('block_complements', $tables)) {
    echo "\nQuery de complementos:\n";
    try {
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
        echo count($rows) > 0 ? json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) : "Sin complementos aún\n";
    } catch (Exception $e) {
        echo "Error en query: " . $e->getMessage() . "\n";
    }
}

// Probar que /blocks/active funciona (simulando la query completa)
echo "\n\nProbando getById del bloque activo...\n";
try {
    $stmt = $db->prepare('SELECT * FROM blocks WHERE id = ?');
    $stmt->execute([$block['id']]);
    $b = $stmt->fetch();
    echo "OK — bloque cargado: {$b['name']}\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "</pre>\n";
