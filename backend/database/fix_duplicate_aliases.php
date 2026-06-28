#!/usr/bin/env php
<?php

/**
 * Limpia aliases duplicados en exercise_aliases
 * Uso: abrir en el navegador
 */

require_once __DIR__ . '/../src/config/config.php';
require_once __DIR__ . '/../src/config/database.php';

$db = Database::connect();

echo "<pre>\n";
echo "Limpiando aliases duplicados...\n\n";

// Buscar duplicados: mismo exercise_id y alias (ignorando mayúsculas)
$stmt = $db->query("
    SELECT exercise_id, LOWER(TRIM(alias)) as alias_lower, COUNT(*) as total, MIN(id) as keep_id
    FROM exercise_aliases
    GROUP BY exercise_id, alias_lower
    HAVING COUNT(*) > 1
");
$duplicates = $stmt->fetchAll();

if (empty($duplicates)) {
    echo "No hay aliases duplicados. Todo limpio.\n";
} else {
    $deleted = 0;
    foreach ($duplicates as $dup) {
        // Borrar todos excepto el de menor id
        $stmt = $db->prepare("
            DELETE FROM exercise_aliases
            WHERE exercise_id = ?
            AND LOWER(TRIM(alias)) = ?
            AND id != ?
        ");
        $stmt->execute([$dup['exercise_id'], $dup['alias_lower'], $dup['keep_id']]);
        $rows = $stmt->rowCount();
        $deleted += $rows;
        echo "Eliminados $rows duplicados de '{$dup['alias_lower']}' (exercise_id: {$dup['exercise_id']})\n";
    }
    echo "\nTotal eliminados: $deleted aliases duplicados.\n";
}

echo "\n✅ Listo.\n";
echo "</pre>\n";
