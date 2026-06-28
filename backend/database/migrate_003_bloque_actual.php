#!/usr/bin/env php
<?php

/**
 * Migración: insertar bloque "Bloque Actual" con sub-bloques A, B, C, D
 * Uso: abrir en el navegador
 */

require_once __DIR__ . '/../src/config/config.php';
require_once __DIR__ . '/../src/config/database.php';

$db = Database::connect();

echo "<pre>\n";
echo "Insertando bloque con sus ejercicios...\n\n";

// ─────────────────────────────────────────────
// EJERCICIOS DEL BLOQUE
// Formato: [nombre_canonico, aliases[], sub_bloque, sets, reps, rest_seg, notas]
// ─────────────────────────────────────────────

$data = [
    // BLOQUE A
    ['Hack Squat',                    ['Hack Squat Tempo'],                   'A', 4, '12-10',    null, 'Tempo'],
    ['Pull Up con Lastre',            ['Pull Up "Lastre"', 'Pull Up Lastre'], 'A', 4, '8-6-4-2',  null, '+ 15 F.Diamante'],
    ['Static Split Lunge KB',         ['Static Split Lunge KB\'s'],           'A', 3, '12/12',    null, null],
    ['Jalón Supino',                  ['Jalón Supino'],                       'A', 4, '12-10',    null, null],
    ['Extensión Cuádriceps',          ['Extensión Cuádriceps'],               'A', 3, '15',       null, '+ Drop Set'],
    ['Rack Chins con Lastre',         ['Rack Chins "Lastre"', 'Rack Chins'], 'A', 3, '10',       null, null],

    // BLOQUE B
    ['Peso Muerto',                   ['Peso Muerto'],                        'B', 4, '8-6-4-2',  null, '+ 15/10 Fondos'],
    ['Press Banca Pausa',             ['Press Banca Stop 2"', 'Press Banca Pausa 2"'], 'B', 4, '8-10', null, 'Stop 2" + 1 Drop Set'],
    ['Curl Femoral Tumbado',          ['Curl Femoral Tumbado'],               'B', 3, '12-14',   null, '+ Drop Set'],
    ['Press de Pecho Inclinado 45°',  ['Press Pecho Inclinado 45° DB\'s', 'Press de Pecho Inclinado Mancuernas'], 'B', 4, '12-10', null, 'Mancuernas 45°'],
    ['Abductores',                    ['Abductores'],                         'B', 3, '15-20',   null, null],
    ['Iso Pullover Deadbug',          ['Iso Pullover Deadbug'],               'B', 3, '20',      null, null],

    // BLOQUE C
    ['Bounce Squat Belt Machine',     ['Bounce Squat (Belt Machine)', 'Bounce Squat'], 'C', 4, '12', null, 'Tempo'],
    ['Pendlay MP',                    ['Pendley MP', 'Press Militar Pendlay'], 'C', 4, '8',      null, 'Pregunta variantes'],
    ['Prensa Unilateral',             ['Prensa Unilat', 'Prensa Unilateral'], 'C', 3, '12/12',  null, null],
    ['Remo Gironda Agarre Nautilus',  ['Remo Gironda Agarre Nautilus', 'Remo Gironda Nautilus'], 'C', 4, '10-12', null, null],
    ['Aductores',                     ['Aductores'],                          'C', 3, '15-20',  null, null],
    ['Pull Caballero Vertical',       ['Pull Caballero Vertical'],            'C', 3, '10/10',  null, null],

    // BLOQUE D
    ['Hip Thrust Truco',              ['Hipthrust "Truco"', 'Hip Thrust'],   'D', 4, '12-14',  null, 'Técnica truco'],
    ['Flexiones con Lastre',          ['Flexiones "Lastradas"', 'Flexiones Lastradas'], 'D', 3, '10+10+10', null, 'L++ / L+ / sin lastre'],
    ['Trineo Empuje Heavy',           ['Trineo Empuje (Heavy)', 'Trineo Empuje'], 'D', 4, '2 tiradas', null, 'Heavy'],
    ['Biserie Press Militar + Elevación Lateral', ['Press Militar 80° + Elevación Lat', 'Biserie P.Militar Elevación'], 'D', 3, '10+10', null, 'Press Militar 80° + Elevación Lateral'],
    ['Asymmetric Deadlift KB',        ['Asimétric Deadlift KB', 'Deadlift Asimétrico KB'], 'D', 3, '10/10', null, null],
    ['Aperturas en Máquina',          ['Aperturas en Maq.', 'Aperturas Máquina'], 'D', 3, '12', null, '+ 1 Drop Set'],
];

$db->beginTransaction();

try {
    // 1. Crear el bloque
    $blockName = 'Bloque Actual';
    $startDate = date('Y-m-d');

    // Comprobar si ya existe
    $check = $db->prepare("SELECT id FROM blocks WHERE name = ?");
    $check->execute([$blockName]);
    if ($check->fetch()) {
        echo "⚠️  El bloque '$blockName' ya existe. Cambia el nombre en el script si quieres crear otro.\n";
        exit;
    }

    $stmt = $db->prepare("INSERT INTO blocks (name, start_date) VALUES (?, ?)");
    $stmt->execute([$blockName, $startDate]);
    $blockId = (int)$db->lastInsertId();
    echo "✓ Bloque '$blockName' creado (id: $blockId)\n\n";

    $stmtEx    = $db->prepare("INSERT OR IGNORE INTO exercises (canonical_name, adaptations) VALUES (?, '[]')");
    $stmtAlias = $db->prepare("INSERT OR IGNORE INTO exercise_aliases (exercise_id, alias) VALUES (?, ?)");
    $stmtBE    = $db->prepare("INSERT INTO block_exercises (block_id, exercise_id, sub_block, recommended_sets, recommended_reps, recommended_rest_seconds, notes, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmtGet   = $db->prepare("SELECT id FROM exercises WHERE canonical_name = ?");

    $order = ['A' => 0, 'B' => 0, 'C' => 0, 'D' => 0];

    foreach ($data as [$canonical, $aliases, $sub, $sets, $reps, $rest, $notes]) {
        // Buscar o crear ejercicio
        $stmtGet->execute([$canonical]);
        $existing = $stmtGet->fetch();

        if ($existing) {
            $exerciseId = $existing['id'];
            echo "→ Ejercicio ya existe: $canonical (id: $exerciseId)\n";
        } else {
            $stmtEx->execute([$canonical]);
            $exerciseId = (int)$db->lastInsertId();
            echo "✓ Ejercicio creado: $canonical (id: $exerciseId)\n";
        }

        // Insertar aliases que no existan
        foreach ($aliases as $alias) {
            if (strtolower($alias) !== strtolower($canonical)) {
                $stmtAlias->execute([$exerciseId, $alias]);
            }
        }

        // Insertar en el bloque
        $stmtBE->execute([
            $blockId, $exerciseId, $sub,
            $sets, $reps, $rest, $notes,
            $order[$sub]++
        ]);
    }

    $db->commit();

    echo "\n✅ Bloque '$blockName' creado con " . count($data) . " ejercicios distribuidos en los sub-bloques A, B, C y D.\n";
    echo "Fecha de inicio: $startDate\n";

} catch (Exception $e) {
    $db->rollBack();
    echo "\n❌ Error: " . $e->getMessage() . "\n";
}

echo "</pre>\n";
