#!/usr/bin/env php
<?php

require_once __DIR__ . '/../src/config/config.php';
require_once __DIR__ . '/../src/config/database.php';

$db = Database::connect();

echo "<pre>\n";
echo "Migración 007 — mover complementos a su tabla correcta...\n\n";

$db->beginTransaction();

try {

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

$stmtGetEx    = $db->prepare("SELECT id FROM exercises WHERE canonical_name = ?");
$stmtGetAlias = $db->prepare("SELECT exercise_id FROM exercise_aliases WHERE LOWER(alias) = LOWER(?)");
$stmtCreateEx = $db->prepare("INSERT OR IGNORE INTO exercises (canonical_name, adaptations) VALUES (?, '[]')");
$stmtDelBE    = $db->prepare("DELETE FROM block_exercises WHERE id = ?");
$stmtComp     = $db->prepare("INSERT INTO block_complements (block_id, sub_block, methodology, parameter, notes, order_index) VALUES (?, ?, ?, ?, ?, ?)");
$stmtCompEx   = $db->prepare("INSERT INTO block_complement_exercises (complement_id, exercise_id, reps, notes, order_index) VALUES (?, ?, ?, ?, ?)");

function findOrCreate(PDO $db, $stmtGet, $stmtGetAlias, $stmtCreate, string $name, array $aliases = []): int {
    $stmtGet->execute([$name]);
    $row = $stmtGet->fetch();
    if ($row) return (int)$row['id'];

    foreach ($aliases as $alias) {
        $stmtGetAlias->execute([$alias]);
        $row = $stmtGetAlias->fetch();
        if ($row) {
            echo "  Mapeado por alias '$alias': $name\n";
            return (int)$row['exercise_id'];
        }
    }

    $stmtCreate->execute([$name]);
    $id = (int)$db->lastInsertId();
    echo "  Creado ejercicio: $name (id:$id)\n";
    return $id;
}

// ─────────────────────────────────────────────────────────────
// OBTENER IDs DE LOS BLOQUES
// ─────────────────────────────────────────────────────────────

$stmtBlock = $db->prepare("SELECT id FROM blocks WHERE name = ?");

$stmtBlock->execute(['Bloque Actual']);
$blockActual = $stmtBlock->fetch();
$idActual = $blockActual ? (int)$blockActual['id'] : null;

$stmtBlock->execute(['Bloque 21 Junio']);
$bloque21 = $stmtBlock->fetch();
$id21 = $bloque21 ? (int)$bloque21['id'] : null;

echo "Bloque Actual id: " . ($idActual ?? 'NO ENCONTRADO') . "\n";
echo "Bloque 21 Junio id: " . ($id21 ?? 'NO ENCONTRADO') . "\n\n";

// ─────────────────────────────────────────────────────────────
// EJERCICIOS DE COMPLEMENTO QUE HAY QUE CREAR SI NO EXISTEN
// ─────────────────────────────────────────────────────────────

$exIds = [];

// Comunes a ambos bloques
$exIds['triceps_polea']        = findOrCreate($db, $stmtGetEx, $stmtGetAlias, $stmtCreateEx, 'Tríceps Polea',              ['Triceps Polea']);
$exIds['knees_chest_par']      = findOrCreate($db, $stmtGetEx, $stmtGetAlias, $stmtCreateEx, 'Knees to Chest Paralelas',   ['Knees to Chest en Paralelas']);
$exIds['knees_chest_lsit']     = findOrCreate($db, $stmtGetEx, $stmtGetAlias, $stmtCreateEx, 'Knees to Chest or L-Sit',    []);
$exIds['bici_doble']           = findOrCreate($db, $stmtGetEx, $stmtGetAlias, $stmtCreateEx, 'Calorías Bici Doble',        ['Calorias Bici Doble']);
$exIds['kb_swings']            = findOrCreate($db, $stmtGetEx, $stmtGetAlias, $stmtCreateEx, 'KB Swings',                  []);
$exIds['wallballs']            = findOrCreate($db, $stmtGetEx, $stmtGetAlias, $stmtCreateEx, 'Wallballs',                  []);
$exIds['hollow_crunch']        = findOrCreate($db, $stmtGetEx, $stmtGetAlias, $stmtCreateEx, 'Hollow Crunch',              []);
$exIds['thrusters_dbs']        = findOrCreate($db, $stmtGetEx, $stmtGetAlias, $stmtCreateEx, 'Thrusters DB',               ['Thrusters DB\'s', 'Thrusters DBs']);
$exIds['air_bike']             = findOrCreate($db, $stmtGetEx, $stmtGetAlias, $stmtCreateEx, 'Calorías Air Bike',          ['Cal Air Bike', 'Calorias Air Bike']);
$exIds['farmer_carry']         = findOrCreate($db, $stmtGetEx, $stmtGetAlias, $stmtCreateEx, 'Farmer Carry',               []);
$exIds['trx_pull']             = findOrCreate($db, $stmtGetEx, $stmtGetAlias, $stmtCreateEx, 'TRX Pull',                   []);
$exIds['trx_triceps']          = findOrCreate($db, $stmtGetEx, $stmtGetAlias, $stmtCreateEx, 'TRX Tríceps',                ['TRX Triceps']);
$exIds['high_box_jumps']       = findOrCreate($db, $stmtGetEx, $stmtGetAlias, $stmtCreateEx, 'High Box Jumps',             []);
$exIds['calorias_erg']         = findOrCreate($db, $stmtGetEx, $stmtGetAlias, $stmtCreateEx, 'Calorías ERG',               ['Calorias ERG']);

// Bloque Actual A
$exIds['rack_chins']           = findOrCreate($db, $stmtGetEx, $stmtGetAlias, $stmtCreateEx, 'Rack Chins con Lastre',      ['Rack Chins "Lastre"', 'Rack Chins']);

// Bloque 21 Junio A
$exIds['burpee_push_up']       = findOrCreate($db, $stmtGetEx, $stmtGetAlias, $stmtCreateEx, 'Burpee Push Up',             []);
$exIds['plyo_split_lunge']     = findOrCreate($db, $stmtGetEx, $stmtGetAlias, $stmtCreateEx, 'Plyo Split Lunge',           []);
$exIds['vups_tuck_ups']        = findOrCreate($db, $stmtGetEx, $stmtGetAlias, $stmtCreateEx, 'V-Ups / Tuck Ups',           ['V-Ups/Tuck Ups']);

// Bloque 21 Junio D
$exIds['rodillos_abdominal']   = findOrCreate($db, $stmtGetEx, $stmtGetAlias, $stmtCreateEx, 'Rodillos Abdominal',         []);
$exIds['empujo_cinta']         = findOrCreate($db, $stmtGetEx, $stmtGetAlias, $stmtCreateEx, 'Empujo Cinta Apagada Potencia', ['Empujo Cinta Apagada']);

echo "\n";

// ─────────────────────────────────────────────────────────────
// ELIMINAR EJERCICIOS DE COMPLEMENTO DE block_exercises
// Estos son los que están en las notas de la migración como
// "Biserie con..." o que tienen nombres de complemento
// ─────────────────────────────────────────────────────────────

// Nombres canónicos que son complementos y no deben estar en block_exercises
$complementExerciseNames = [
    'Tríceps Polea', 'Triceps Polea',
    'Knees to Chest Paralelas', 'Knees to Chest en Paralelas', 'Knees to Chest or L-Sit',
    'Calorías Bici Doble', 'KB Swings', 'Wallballs', 'Hollow Crunch',
    'Thrusters DB', 'Calorías Air Bike', 'Farmer Carry',
    'TRX Pull', 'TRX Tríceps', 'High Box Jumps', 'Calorías ERG',
    'Burpee Push Up', 'Plyo Split Lunge', 'V-Ups / Tuck Ups',
    'Rodillos Abdominal', 'Empujo Cinta Apagada Potencia',
];

echo "Eliminando ejercicios de complemento de block_exercises...\n";
$stmtFindBE = $db->prepare("
    SELECT be.id, e.canonical_name, be.block_id, be.sub_block
    FROM block_exercises be
    JOIN exercises e ON e.id = be.exercise_id
    WHERE LOWER(e.canonical_name) IN (" . implode(',', array_fill(0, count($complementExerciseNames), '?')) . ")
");
$stmtFindBE->execute(array_map('strtolower', $complementExerciseNames));
$toDelete = $stmtFindBE->fetchAll();

foreach ($toDelete as $be) {
    $stmtDelBE->execute([$be['id']]);
    echo "  Eliminado de block_exercises: '{$be['canonical_name']}' (bloque_id:{$be['block_id']}, sub:{$be['sub_block']})\n";
}
echo "\n";

// ─────────────────────────────────────────────────────────────
// CREAR COMPLEMENTOS
// ─────────────────────────────────────────────────────────────

// Función helper
function createComplement(PDO $db, $stmtComp, $stmtCompEx, int $blockId, string $sub, string $method, string $param, array $exercises): void {
    if (!$blockId) { echo "  SKIP: bloque no encontrado\n"; return; }
    $stmtComp->execute([$blockId, $sub, $method, $param, null, 0]);
    $compId = (int)$db->lastInsertId();
    echo "  Complemento creado id:$compId — $sub | $method $param\n";
    foreach ($exercises as $i => [$exId, $reps, $notes]) {
        $stmtCompEx->execute([$compId, $exId, $reps, $notes, $i]);
    }
}

// ── BLOQUE ACTUAL ──────────────────────────────────────────
if ($idActual) {
    echo "=== Complementos Bloque Actual ===\n";

    // A — EMOM 12 min
    createComplement($db, $stmtComp, $stmtCompEx, $idActual, 'A', 'EMOM', '12 minutos', [
        [$exIds['triceps_polea'],    '12',    null],
        [$exIds['knees_chest_lsit'], '15/10', null],
    ]);

    // B — 21-15-9
    createComplement($db, $stmtComp, $stmtCompEx, $idActual, 'B', '21-15-9', null, [
        [$exIds['bici_doble'],    null, null],
        [$exIds['kb_swings'],     null, null],
        [$exIds['wallballs'],     null, null],
        [$exIds['hollow_crunch'], null, null],
    ]);

    // C — AMRAP 12'
    createComplement($db, $stmtComp, $stmtCompEx, $idActual, 'C', 'AMRAP', "12'", [
        [$exIds['thrusters_dbs'],   '10',  null],
        [$exIds['knees_chest_par'], '10',  null],
        [$exIds['air_bike'],        '10',  null],
        [$exIds['farmer_carry'],    '40M', null],
    ]);

    // D — 3 Rounds for Time
    createComplement($db, $stmtComp, $stmtCompEx, $idActual, 'D', 'Rounds for Time', '3 rondas', [
        [$exIds['trx_pull'],      '10', null],
        [$exIds['trx_triceps'],   '10', null],
        [$exIds['high_box_jumps'],'15', null],
        [$exIds['calorias_erg'],  '15', null],
    ]);

    echo "\n";
}

// ── BLOQUE 21 JUNIO ────────────────────────────────────────
if ($id21) {
    echo "=== Complementos Bloque 21 Junio ===\n";

    // A — EMOM 12 min
    createComplement($db, $stmtComp, $stmtCompEx, $id21, 'A', 'EMOM', '12 minutos', [
        [$exIds['rack_chins'],       '15/10', 'Min 1'],
        [$exIds['burpee_push_up'],   '10/8',  'Min 2'],
        [$exIds['plyo_split_lunge'], '20',    'Min 3'],
        [$exIds['vups_tuck_ups'],    '15',    'Min 4'],
    ]);

    // B — 21-15-9
    createComplement($db, $stmtComp, $stmtCompEx, $id21, 'B', '21-15-9', null, [
        [$exIds['bici_doble'],    null, null],
        [$exIds['kb_swings'],     null, null],
        [$exIds['wallballs'],     null, null],
        [$exIds['hollow_crunch'], null, null],
    ]);

    // C — AMRAP 12'
    createComplement($db, $stmtComp, $stmtCompEx, $id21, 'C', 'AMRAP', "12'", [
        [$exIds['thrusters_dbs'],   '10',  null],
        [$exIds['knees_chest_par'], '10',  null],
        [$exIds['air_bike'],        '10',  null],
        [$exIds['farmer_carry'],    '40M', null],
    ]);

    // D — 3 Rounds for Time
    createComplement($db, $stmtComp, $stmtCompEx, $id21, 'D', 'Rounds for Time', '3 rondas', [
        [$exIds['rodillos_abdominal'], '12',   null],
        [$exIds['empujo_cinta'],       "30''", null],
    ]);

    echo "\n";
}

$db->commit();
echo "✅ Migración completada.\n";

} catch (Exception $e) {
    $db->rollBack();
    echo "\n❌ Error: " . $e->getMessage() . "\n";
}

echo "</pre>\n";
