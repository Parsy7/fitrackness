#!/usr/bin/env php
<?php

/**
 * Migración nuclear — borra todos los bloques y los recrea
 * correctamente con ejercicios normales y complementos separados
 */

require_once __DIR__ . '/../src/config/config.php';
require_once __DIR__ . '/../src/config/database.php';

$db = Database::connect();

echo "<pre>\n";
echo "Migración nuclear — recreando bloques desde cero...\n\n";

$db->beginTransaction();

try {

// ─────────────────────────────────────────────────────────────
// 1. BORRAR TODO LO RELACIONADO CON BLOQUES
// ─────────────────────────────────────────────────────────────

$db->exec("DELETE FROM block_complement_exercises");
$db->exec("DELETE FROM block_complements");
$db->exec("DELETE FROM block_exercises");
$db->exec("DELETE FROM blocks");
echo "✓ Bloques borrados\n\n";

// ─────────────────────────────────────────────────────────────
// 2. HELPERS
// ─────────────────────────────────────────────────────────────

function findOrCreate(PDO $db, string $name, array $aliases = []): int {
    $stmt = $db->prepare("SELECT id FROM exercises WHERE LOWER(canonical_name) = LOWER(?)");
    $stmt->execute([$name]);
    $row = $stmt->fetch();
    if ($row) return (int)$row['id'];

    foreach ($aliases as $alias) {
        $stmt = $db->prepare("SELECT exercise_id FROM exercise_aliases WHERE LOWER(alias) = LOWER(?)");
        $stmt->execute([$alias]);
        $row = $stmt->fetch();
        if ($row) {
            echo "  Mapeado '$alias' → $name\n";
            return (int)$row['exercise_id'];
        }
    }

    $db->prepare("INSERT INTO exercises (canonical_name, adaptations) VALUES (?, '[]')")->execute([$name]);
    $id = (int)$db->lastInsertId();
    echo "  Creado ejercicio: $name (id:$id)\n";
    return $id;
}

function createBlock(PDO $db, string $name, string $date): int {
    $db->prepare("INSERT INTO blocks (name, start_date) VALUES (?, ?)")->execute([$name, $date]);
    $id = (int)$db->lastInsertId();
    echo "✓ Bloque '$name' creado (id:$id)\n";
    return $id;
}

function addExercise(PDO $db, int $blockId, int $exId, string $sub, $sets, $reps, $rest, $notes, int $order): void {
    $db->prepare("INSERT INTO block_exercises (block_id, exercise_id, sub_block, recommended_sets, recommended_reps, recommended_rest_seconds, notes, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
       ->execute([$blockId, $exId, $sub, $sets, $reps, $rest, $notes, $order]);
}

function addComplement(PDO $db, int $blockId, string $sub, string $method, ?string $param, array $exercises): void {
    $db->prepare("INSERT INTO block_complements (block_id, sub_block, methodology, parameter, order_index) VALUES (?, ?, ?, ?, 0)")
       ->execute([$blockId, $sub, $method, $param]);
    $compId = (int)$db->lastInsertId();
    echo "  Complemento: $sub | $method" . ($param ? " $param" : "") . "\n";
    foreach ($exercises as $i => [$exId, $reps, $notes]) {
        $db->prepare("INSERT INTO block_complement_exercises (complement_id, exercise_id, reps, notes, order_index) VALUES (?, ?, ?, ?, ?)")
           ->execute([$compId, $exId, $reps, $notes, $i]);
    }
}

// ─────────────────────────────────────────────────────────────
// 3. EJERCICIOS — obtener IDs (creando si no existen)
// ─────────────────────────────────────────────────────────────

echo "Resolviendo ejercicios...\n";

// Ejercicios normales
$sumo_dl         = findOrCreate($db, 'Sumo Deadlift',                    ['Sumo DL', 'SUMO DL']);
$flex_neutras    = findOrCreate($db, 'Flexiones Neutras',                []);
$pullup_lastre   = findOrCreate($db, 'Pull Up con Lastre',               ['Pull Up Prono Sup Lastre', 'Pull Up "Lastre"']);
$split_lunge_kb  = findOrCreate($db, 'Static Split Lunge KB',           ['Static Split Lunge KB\'s']);
$jalon_supino    = findOrCreate($db, 'Jalón Supino',                     ['Jalon Supino']);
$ext_cuad        = findOrCreate($db, 'Extensión Cuádriceps',             ['Exten. Cuadriceps', 'Extension Cuadriceps']);
$rack_chins      = findOrCreate($db, 'Rack Chins con Lastre',            ['Rack Chins "Lastre"', 'Rack Chins']);
$box_squat       = findOrCreate($db, 'Box Back Squat',                   ['Box Backsquat']);
$press_banca     = findOrCreate($db, 'Press Banca Pausa',                ['Press Banca Pause', 'Press Banca Pausa 2seg']);
$subida_cajon    = findOrCreate($db, 'Subida a Cajón con Barra',         ['Subida a Cajon con Barra']);
$press_conv      = findOrCreate($db, 'Press Convergente Inclinado',      ['Press Conver. Inclinado']);
$soleo           = findOrCreate($db, 'Sóleo',                            ['Soleo']);
$hex_dl          = findOrCreate($db, 'Hex Bar Deadlift',                 ['Hex Bar DL', 'HEX BAR DL']);
$flex_normales   = findOrCreate($db, 'Flexiones Normales',               []);
$jalon_neutro    = findOrCreate($db, 'Jalón Neutro Nautilus',            ['Jalon Neutro Nautilis']);
$zancadas_saco   = findOrCreate($db, 'Zancadas Andando con Saco',        ['Zancadas Andando Saco']);
$remo_mancuerna  = findOrCreate($db, 'Remo Mancuerna',                   []);
$abductores      = findOrCreate($db, 'Abductores',                       []);
$curl_biceps     = findOrCreate($db, 'Curl Bíceps Polea',                ['Curl Biceps Polea']);
$zercher         = findOrCreate($db, 'Zercher Squat',                    []);
$press_mil_mancA = findOrCreate($db, 'Press Militar Mancuernas Sentado', []);
$curl_femoral    = findOrCreate($db, 'Curl Femoral Tumbado',             []);
$press_cerrado   = findOrCreate($db, 'Press Cerrado Multipower',         []);
$aperturas       = findOrCreate($db, 'Aperturas en Máquina',             ['Aperturas en Maq.', 'Aperturas Maquina']);
$aductores       = findOrCreate($db, 'Aductores',                        []);
$monster_walk    = findOrCreate($db, 'Monster Walk con Gomas',           ['Monster Walk Gomas']);

// Bloque Actual extra
$hack_squat      = findOrCreate($db, 'Hack Squat',                       []);
$peso_muerto     = findOrCreate($db, 'Peso Muerto',                      []);
$press_pecho45   = findOrCreate($db, 'Press de Pecho Inclinado 45°',     ['Press Pecho Inclinado 45° DB\'s']);
$iso_pull        = findOrCreate($db, 'Iso Pullover Deadbug',             []);
$bounce_squat    = findOrCreate($db, 'Bounce Squat Belt Machine',         ['Bounce Squat (Belt Machine)']);
$pendlay         = findOrCreate($db, 'Pendlay MP',                       ['Pendley MP']);
$prensa_uni      = findOrCreate($db, 'Prensa Unilateral',                ['Prensa Unilat']);
$remo_nautilus   = findOrCreate($db, 'Remo Gironda Agarre Nautilus',     []);
$pull_caballero  = findOrCreate($db, 'Pull Caballero Vertical',          []);
$hipthrust       = findOrCreate($db, 'Hip Thrust Truco',                 ['Hipthrust "Truco"']);
$flex_lastradas  = findOrCreate($db, 'Flexiones con Lastre',             ['Flexiones "Lastradas"']);
$trineo          = findOrCreate($db, 'Trineo Empuje Heavy',              ['Trineo Empuje (Heavy)']);
$biserie_mil_el  = findOrCreate($db, 'Biserie Press Militar + Elevación Lateral', ['Press Militar 80° + Elevación Lat']);
$asym_dl         = findOrCreate($db, 'Asymmetric Deadlift KB',           ['Asimetric Deadlift KB']);

// Complementos
$triceps_polea   = findOrCreate($db, 'Tríceps Polea',                    ['Triceps Polea']);
$knees_lsit      = findOrCreate($db, 'Knees to Chest or L-Sit',          []);
$bici_doble      = findOrCreate($db, 'Calorías Bici Doble',              ['Calorias Bici Doble']);
$kb_swings       = findOrCreate($db, 'KB Swings',                        []);
$wallballs       = findOrCreate($db, 'Wallballs',                        []);
$hollow_crunch   = findOrCreate($db, 'Hollow Crunch',                    []);
$thrusters       = findOrCreate($db, 'Thrusters DB',                     ['Thrusters DB\'s']);
$knees_par       = findOrCreate($db, 'Knees to Chest Paralelas',         ['Knees to Chest en Paralelas']);
$air_bike        = findOrCreate($db, 'Calorías Air Bike',                ['Cal Air Bike']);
$farmer_carry    = findOrCreate($db, 'Farmer Carry',                     []);
$trx_pull        = findOrCreate($db, 'TRX Pull',                         []);
$trx_triceps     = findOrCreate($db, 'TRX Tríceps',                      ['TRX Triceps']);
$high_box        = findOrCreate($db, 'High Box Jumps',                   []);
$cal_erg         = findOrCreate($db, 'Calorías ERG',                     ['Calorias ERG']);
$burpee_pu       = findOrCreate($db, 'Burpee Push Up',                   []);
$plyo_lunge      = findOrCreate($db, 'Plyo Split Lunge',                 []);
$vups_tuck       = findOrCreate($db, 'V-Ups / Tuck Ups',                 ['V-Ups/Tuck Ups']);
$rodillos        = findOrCreate($db, 'Rodillos Abdominal',               []);
$empujo_cinta    = findOrCreate($db, 'Empujo Cinta Apagada Potencia',    []);

echo "\n";

// ─────────────────────────────────────────────────────────────
// 4. BLOQUE ACTUAL (id será 1 de nuevo tras el borrado)
// ─────────────────────────────────────────────────────────────

echo "=== BLOQUE ACTUAL ===\n";
$bA = createBlock($db, 'Bloque Actual', '2026-05-20');

// Sub-bloque A
addExercise($db, $bA, $hack_squat,    'A', 4, '12-10',  120, 'Tempo', 0);
addExercise($db, $bA, $pullup_lastre, 'A', 4, '8-6-4-2',null,'+ 15 F.Diamante', 1);
addExercise($db, $bA, $split_lunge_kb,'A', 3, '12/12',  null, null, 2);
addExercise($db, $bA, $jalon_supino,  'A', 4, '12-10',  null, null, 3);
addExercise($db, $bA, $ext_cuad,      'A', 3, '15',     null, '+ Drop Set', 4);
addExercise($db, $bA, $rack_chins,    'A', 3, '10',     null, null, 5);
addComplement($db, $bA, 'A', 'EMOM', '12 minutos', [
    [$triceps_polea, '12',    'Min 1'],
    [$knees_lsit,    '15/10', 'Min 2'],
]);

// Sub-bloque B
addExercise($db, $bA, $peso_muerto,   'B', 4, '8-6-4-2',null, '+ 15/10 Fondos', 0);
addExercise($db, $bA, $press_banca,   'B', 4, '8-10',   null, 'Stop 2" + 1 Drop Set', 1);
addExercise($db, $bA, $curl_femoral,  'B', 3, '12-14',  null, '+ Drop Set', 2);
addExercise($db, $bA, $press_pecho45, 'B', 4, '12-10',  null, 'Mancuernas 45°', 3);
addExercise($db, $bA, $abductores,    'B', 3, '15-20',  null, null, 4);
addExercise($db, $bA, $iso_pull,      'B', 3, '20',     null, null, 5);
addComplement($db, $bA, 'B', '21-15-9', null, [
    [$bici_doble,    null, null],
    [$kb_swings,     null, null],
    [$wallballs,     null, null],
    [$hollow_crunch, null, null],
]);

// Sub-bloque C
addExercise($db, $bA, $bounce_squat,  'C', 4, '12',     null, 'Tempo', 0);
addExercise($db, $bA, $pendlay,       'C', 4, '8',      null, 'Pregunta variantes', 1);
addExercise($db, $bA, $prensa_uni,    'C', 3, '12/12',  null, null, 2);
addExercise($db, $bA, $remo_nautilus, 'C', 4, '10-12',  null, null, 3);
addExercise($db, $bA, $aductores,     'C', 3, '15-20',  null, null, 4);
addExercise($db, $bA, $pull_caballero,'C', 3, '10/10',  null, null, 5);
addComplement($db, $bA, 'C', 'AMRAP', "12'", [
    [$thrusters,  '10',  null],
    [$knees_par,  '10',  null],
    [$air_bike,   '10',  null],
    [$farmer_carry,'40M',null],
]);

// Sub-bloque D
addExercise($db, $bA, $hipthrust,     'D', 4, '12-14',  null, 'Técnica truco', 0);
addExercise($db, $bA, $flex_lastradas,'D', 3, '10+10+10',null,'L++ / L+ / sin lastre', 1);
addExercise($db, $bA, $trineo,        'D', 4, '2 tiradas',null,'Heavy', 2);
addExercise($db, $bA, $biserie_mil_el,'D', 3, '10+10',  null, 'Press Militar 80° + Elevación Lateral', 3);
addExercise($db, $bA, $asym_dl,       'D', 3, '10/10',  null, null, 4);
addExercise($db, $bA, $aperturas,     'D', 3, '12',     null, '+ 1 Drop Set', 5);
addComplement($db, $bA, 'D', 'Rounds for Time', '3 rondas', [
    [$trx_pull,   '10', null],
    [$trx_triceps,'10', null],
    [$high_box,   '15', null],
    [$cal_erg,    '15', null],
]);

echo "\n";

// ─────────────────────────────────────────────────────────────
// 5. BLOQUE 21 JUNIO
// ─────────────────────────────────────────────────────────────

echo "=== BLOQUE 21 JUNIO ===\n";
$b21 = createBlock($db, 'Bloque 21 Junio', '2026-06-21');

// Sub-bloque A
addExercise($db, $b21, $sumo_dl,       'A', 4, '8',      120, '+ Flexiones Neutras 12/8', 0);
addExercise($db, $b21, $flex_neutras,  'A', null,'12/8', null, 'Biserie con Sumo DL', 1);
addExercise($db, $b21, $pullup_lastre, 'A', 4, '3+3',    180, 'Jalon como alternativa', 2);
addExercise($db, $b21, $split_lunge_kb,'A', 3, '10-10',  45,  'Descanso entre piernas', 3);
addExercise($db, $b21, $ext_cuad,      'A', 3, '15',     120, '+ Jump Squats', 4);
addComplement($db, $b21, 'A', 'EMOM', '12 minutos', [
    [$rack_chins,  '15/10', 'Min 1'],
    [$burpee_pu,   '10/8',  'Min 2'],
    [$plyo_lunge,  '20',    'Min 3'],
    [$vups_tuck,   '15',    'Min 4'],
]);

// Sub-bloque B
addExercise($db, $b21, $box_squat,    'B', 4, '8',      120, '+ 40seg Iso Squat Pared', 0);
addExercise($db, $b21, $press_banca,  'B', 4, '10-8',   150, 'Pausa 2 seg', 1);
addExercise($db, $b21, $subida_cajon, 'B', 3, '8/8',    120, null, 2);
addExercise($db, $b21, $press_conv,   'B', 3, '12',     120, null, 3);
addExercise($db, $b21, $soleo,        'B', 3, '15',     120, '+ 12 Tríceps Polea', 4);
addComplement($db, $b21, 'B', '21-15-9', null, [
    [$bici_doble,    null, null],
    [$kb_swings,     null, null],
    [$wallballs,     null, null],
    [$hollow_crunch, null, null],
]);

// Sub-bloque C
addExercise($db, $b21, $hex_dl,       'C', 4, '8',      120, '+ Flexiones Normales 12/8', 0);
addExercise($db, $b21, $flex_normales,'C', null,'12/8', null, 'Biserie con Hex Bar DL', 1);
addExercise($db, $b21, $jalon_neutro, 'C', 4, '10-12',  150, null, 2);
addExercise($db, $b21, $zancadas_saco,'C', 3, '40M',    null, null, 3);
addExercise($db, $b21, $remo_mancuerna,'C',3, '10/10',  45,  'Descanso entre brazos', 4);
addExercise($db, $b21, $abductores,   'C', 3, '15',     120, '+ 12 Curl Bíceps Polea', 5);
addComplement($db, $b21, 'C', 'AMRAP', "12'", [
    [$thrusters,   '10',  null],
    [$knees_par,   '10',  null],
    [$air_bike,    '10',  null],
    [$farmer_carry,'40M', null],
]);

// Sub-bloque D
addExercise($db, $b21, $zercher,      'D', 4, '10-12',  120, null, 0);
addExercise($db, $b21, $press_mil_mancA,'D',4,'10-12',  150, null, 1);
addExercise($db, $b21, $curl_femoral, 'D', 3, '12-15',  120, null, 2);
addExercise($db, $b21, $press_cerrado,'D', 3, '10',     120, '+ 10 Aperturas', 3);
addExercise($db, $b21, $aductores,    'D', 3, '15',     120, '+ 40M Monster Walk Gomas', 4);
addComplement($db, $b21, 'D', 'Rounds for Time', '3 rondas', [
    [$rodillos,     '12',   null],
    [$empujo_cinta, "30''", null],
]);

echo "\n";

$db->commit();
echo "✅ Todo listo. Bloques recreados correctamente con ejercicios y complementos separados.\n";

} catch (Exception $e) {
    $db->rollBack();
    echo "\n❌ Error: " . $e->getMessage() . "\n";
}

echo "</pre>\n";
