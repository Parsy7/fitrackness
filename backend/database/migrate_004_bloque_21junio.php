#!/usr/bin/env php
<?php

/**
 * Migración: insertar bloque "Bloque 21 Junio" con sub-bloques A, B, C, D
 * Uso: abrir en el navegador
 */

require_once __DIR__ . '/../src/config/config.php';
require_once __DIR__ . '/../src/config/database.php';

$db = Database::connect();

echo "<pre>\n";
echo "Insertando bloque 21 Junio...\n\n";

$blockName = 'Bloque 21 Junio';
$startDate = '2026-06-21';

// Comprobar si ya existe
$check = $db->prepare("SELECT id FROM blocks WHERE name = ?");
$check->execute([$blockName]);
if ($check->fetch()) {
    echo "⚠️  El bloque '$blockName' ya existe.\n";
    exit;
}

// [canonical_name, aliases[], sub_bloque, sets, reps, rest_seg, notas]
$data = [
    // BLOQUE A
    ['Sumo Deadlift',              ['Sumo DL', 'SUMO DL'],                      'A', 4,  '8',      120, '+ Flexiones Neutras 12/8'],
    ['Flexiones Neutras',          ['Flexiones Neutras'],                        'A', null,'12/8',  null, 'Biserie con Sumo DL'],
    ['Pull Up Prono con Lastre',   ['Pull Up Prono Sup Lastre', 'Pull Up Prono + Sup "Lastre"'], 'A', 4, '3+3', 180, 'Jalón como alternativa'],
    ['Static Split Lunge MP',      ['Static Split Lunge MP'],                   'A', 3,  '10-10',  45,  'Descanso entre piernas'],
    ['Remo Gironda Prono',         ['Remo Gironda "Prono"', 'Remo Gironda Prono'], 'A', 3, '12',   90,  null],
    ['Extensión Cuádriceps',       ['Exten. Cuádriceps', 'Extensión Cuádriceps'], 'A', 3, '15',   120, '+ 15 Jump Squats'],
    ['Jump Squats',                ['Jump Squats'],                              'A', null,'15',   null, 'Biserie con Extensión Cuádriceps'],

    // BLOQUE B
    ['Box Back Squat',             ['Box Backsquat', 'Box Back Squat'],          'B', 4,  '8',     120, '+ 40'' Iso Squat Pared'],
    ['Press Banca Pausa',          ['Press Banca Pause 2"', 'Press Banca Pausa 2"'], 'B', 4, '10-8', 150, 'Pausa 2'''],
    ['Subida a Cajón con Barra',   ['Subida a Cajón con Barra'],                'B', 3,  '8/8',   120, null],
    ['Press Convergente Inclinado',['Press Conver. Inclinado', 'Press Convergente Inclinado'], 'B', 3, '12', 120, null],
    ['Sóleo',                      ['Sóleo'],                                   'B', 3,  '15',    120, '+ 12 Tríceps Polea'],
    ['Tríceps Polea',              ['Triceps Polea', 'Tríceps Polea'],          'B', null,'12',   null, 'Biserie con Sóleo'],

    // BLOQUE C
    ['Hex Bar Deadlift',           ['Hex Bar DL', 'HEX BAR DL'],               'C', 4,  '8',     120, '+ Flexiones Normales 12/8'],
    ['Flexiones Normales',         ['Flexiones Normales'],                      'C', null,'12/8', null, 'Biserie con Hex Bar DL'],
    ['Jalón Neutro Nautilus',      ['Jalón Neutro Nautilis', 'Jalón Neutro Nautilus'], 'C', 4, '10-12', 150, null],
    ['Zancadas Andando con Saco',  ['Zancadas Andando Saco', '40M Zancadas Andando Saco'], 'C', 3, '40M', null, null],
    ['Remo Mancuerna',             ['Remo Mancuerna'],                          'C', 3,  '10/10', 45,  'Descanso entre brazos'],
    ['Abductores',                 ['Abductores'],                              'C', 3,  '15',    120, '+ 12 Curl Bíceps Polea'],
    ['Curl Bíceps Polea',          ['Curl Biceps Polea', 'Curl Bíceps Polea'], 'C', null,'12',   null, 'Biserie con Abductores'],

    // BLOQUE D
    ['Zercher Squat',              ['Zercher Squat'],                           'D', 4,  '10-12', 120, null],
    ['Press Militar Mancuernas Sentado', ['Press Militar Mancuernas Sentado'],  'D', 4,  '10-12', 150, null],
    ['Curl Femoral Tumbado',       ['Curl Femoral Tumbado'],                   'D', 3,  '12-15', 120, null],
    ['Press Cerrado Multipower',   ['Press Cerrado Multipower'],                'D', 3,  '10',    120, '+ 10 Aperturas'],
    ['Aperturas en Máquina',       ['Aperturas en Maq.', 'Aperturas Máquina'], 'D', null,'10',   null, 'Biserie con Press Cerrado'],
    ['Aductores',                  ['Aductores'],                               'D', 3,  '15',    120, '+ 40M Monster Walk Gomas'],
    ['Monster Walk con Gomas',     ['Monster Walk Gomas', 'Monster Walk con Gomas'], 'D', null, '40M', null, 'Biserie con Aductores'],
];

$db->beginTransaction();

try {
    $stmt = $db->prepare("INSERT INTO blocks (name, start_date) VALUES (?, ?)");
    $stmt->execute([$blockName, $startDate]);
    $blockId = (int)$db->lastInsertId();
    echo "✓ Bloque '$blockName' creado (id: $blockId)\n\n";

    $stmtEx    = $db->prepare("INSERT OR IGNORE INTO exercises (canonical_name, adaptations) VALUES (?, '[]')");
    $stmtAlias = $db->prepare("INSERT OR IGNORE INTO exercise_aliases (exercise_id, alias) VALUES (?, ?)");
    $stmtBE    = $db->prepare("INSERT INTO block_exercises (block_id, exercise_id, sub_block, recommended_sets, recommended_reps, recommended_rest_seconds, notes, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmtGet   = $db->prepare("SELECT id FROM exercises WHERE canonical_name = ?");
    $stmtGetAlias = $db->prepare("SELECT exercise_id FROM exercise_aliases WHERE LOWER(alias) = LOWER(?)");

    $order = ['A' => 0, 'B' => 0, 'C' => 0, 'D' => 0];

    foreach ($data as [$canonical, $aliases, $sub, $sets, $reps, $rest, $notes]) {
        // Buscar por nombre canónico
        $stmtGet->execute([$canonical]);
        $existing = $stmtGet->fetch();

        // Si no, buscar por alias
        if (!$existing) {
            foreach ($aliases as $alias) {
                $stmtGetAlias->execute([$alias]);
                $byAlias = $stmtGetAlias->fetch();
                if ($byAlias) {
                    $existing = ['id' => $byAlias['exercise_id']];
                    echo "→ Mapeado por alias '$alias': $canonical\n";
                    break;
                }
            }
        }

        if ($existing) {
            $exerciseId = $existing['id'];
            echo "→ Ejercicio ya existe: $canonical (id: $exerciseId)\n";
        } else {
            $stmtEx->execute([$canonical]);
            $exerciseId = (int)$db->lastInsertId();
            echo "✓ Ejercicio creado: $canonical (id: $exerciseId)\n";
        }

        // Insertar aliases nuevos
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
    echo "\n✅ Bloque '$blockName' (inicio: $startDate) creado con " . count($data) . " entradas en sub-bloques A, B, C y D.\n";

} catch (Exception $e) {
    $db->rollBack();
    echo "\n❌ Error: " . $e->getMessage() . "\n";
}

echo "</pre>\n";
