#!/usr/bin/env php
<?php

require_once __DIR__ . '/../src/config/config.php';
require_once __DIR__ . '/../src/config/database.php';

$db = Database::connect();

echo "<pre>\n";

$total = $db->query("SELECT COUNT(*) FROM exercises")->fetchColumn();
echo "Total ejercicios en BD: $total\n\n";

echo "--- Todos los ejercicios ---\n";
$stmt = $db->query("SELECT id, canonical_name, muscle_group FROM exercises ORDER BY canonical_name");
foreach ($stmt->fetchAll() as $e) {
    echo "id={$e['id']} | {$e['canonical_name']} | {$e['muscle_group']}\n";
}

echo "</pre>\n";
