#!/usr/bin/env php
<?php

require_once __DIR__ . '/../src/config/config.php';
require_once __DIR__ . '/../src/config/database.php';

$db = Database::connect();

echo "<pre>\n";

$blocks = $db->query("SELECT id, name FROM blocks ORDER BY start_date")->fetchAll();

foreach ($blocks as $block) {
    echo "=== {$block['name']} (id:{$block['id']}) ===\n";

    $stmt = $db->prepare("
        SELECT be.id as be_id, be.sub_block, be.recommended_sets, be.recommended_reps,
               be.recommended_rest_seconds, be.notes, be.order_index,
               e.id as ex_id, e.canonical_name
        FROM block_exercises be
        JOIN exercises e ON e.id = be.exercise_id
        WHERE be.block_id = ?
        ORDER BY be.sub_block, be.order_index
    ");
    $stmt->execute([$block['id']]);
    $exercises = $stmt->fetchAll();

    $bySub = [];
    foreach ($exercises as $ex) {
        $bySub[$ex['sub_block']][] = $ex;
    }

    foreach ($bySub as $sub => $exs) {
        echo "\n  Sub-bloque $sub:\n";
        foreach ($exs as $ex) {
            echo "    [be_id:{$ex['be_id']}] ex_id:{$ex['ex_id']} | {$ex['canonical_name']}";
            if ($ex['recommended_sets']) echo " | {$ex['recommended_sets']}x{$ex['recommended_reps']}";
            if ($ex['recommended_rest_seconds']) echo " | R:{$ex['recommended_rest_seconds']}s";
            if ($ex['notes']) echo " | NOTAS: {$ex['notes']}";
            echo "\n";
        }
    }
    echo "\n";
}

echo "</pre>\n";
