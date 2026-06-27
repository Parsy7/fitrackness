#!/usr/bin/env php
<?php

/**
 * Script de inicialización de la base de datos
 * Uso: php init_db.php
 */

require_once __DIR__ . '/../src/config/config.php';
require_once __DIR__ . '/../src/config/database.php';

echo "Inicializando base de datos Fitrackness...\n";

// Crear tablas
Database::init();
echo "✓ Tablas creadas\n";

$db = Database::connect();

// Crear usuario admin por defecto
$adminEmail = 'admin@fitrackness.com';
$adminPass  = password_hash('admin123', PASSWORD_BCRYPT);

$stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$adminEmail]);

if (!$stmt->fetch()) {
    $db->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')->execute(['Admin', $adminEmail, $adminPass, 'admin']);
    echo "✓ Usuario admin creado: admin@fitrackness.com / admin123\n";
} else {
    echo "→ Usuario admin ya existe\n";
}

// Seed de ejercicios básicos
$exercises = [
    ['Sumo Deadlift',             'Peso muerto con apertura amplia de piernas',               'Piernas',  'Barra',           ['Sumo DL', 'Sumo DL Barra', 'SUMO DL']],
    ['Flexiones Neutras',         'Flexiones con agarre neutro',                              'Pecho',    'Peso corporal',   ['Flexiones Neutras', 'Push Up Neutro']],
    ['Pull Up con Lastre',        'Dominadas con peso adicional',                             'Espalda',  'Barra + Lastre',  ['Pull Up Lastre', 'Pull Up "Lastre"', 'PULL UP PRONO SUP LASTRE']],
    ['Static Split Lunge',        'Zancada estática con mancuernas',                         'Piernas',  'Mancuernas',      ['Static Split Lunge MP', 'Split Lunge Estático']],
    ['Remo Gironda Prono',        'Remo con agarre Gironda en posición prona',                'Espalda',  'Máquina',         ['Remo Gironda "Prono"', 'Remo Gironda Prono']],
    ['Extensión Cuádriceps',      'Extensión de pierna en máquina',                          'Piernas',  'Máquina',         ['Exten. Cuádriceps', 'Extensión Cuádriceps']],
    ['Jump Squats',               'Sentadillas con salto',                                   'Piernas',  'Peso corporal',   ['Jump Squats']],
    ['Hex Bar Deadlift',          'Peso muerto con barra hexagonal',                         'Piernas',  'Hex Bar',         ['Hex Bar DL', 'HEX BAR DL']],
    ['Jalón Neutro Nautilus',     'Jalón con agarre neutro en máquina Nautilus',             'Espalda',  'Máquina',         ['Jalón Neutro Nautilis', 'Jalón Neutro']],
    ['Zancadas Andando con Saco', 'Zancadas caminando con saco de arena',                   'Piernas',  'Saco',            ['Zancadas Andando Saco', '40M Zancadas Andando Saco']],
    ['Remo Mancuerna',            'Remo unilateral con mancuerna',                           'Espalda',  'Mancuerna',       ['Remo Mancuerna']],
    ['Abductores',                'Ejercicio de abductores en máquina',                      'Piernas',  'Máquina',         ['Abductores']],
    ['Curl Bíceps Polea',         'Curl de bíceps en polea',                                 'Brazos',   'Polea',           ['Curl Biceps Polea']],
    ['Box Back Squat',            'Sentadilla trasera con caja',                             'Piernas',  'Barra + Caja',    ['Box Backsquat', 'Box Back Squat']],
    ['Press Banca Pausa',         'Press de banca con pausa en el pecho',                   'Pecho',    'Barra',           ['Press Banca Pause 2"', 'Press Banca Pausa']],
    ['Subida a Cajón con Barra',  'Step up a cajón con barra',                              'Piernas',  'Barra + Cajón',   ['Subida a Cajón con Barra']],
    ['Press Convergente Inclinado','Press inclinado en máquina convergente',                 'Pecho',    'Máquina',         ['Press Conver. Inclinado', 'Press Convergente Inclinado']],
    ['Sóleo',                     'Elevación de talones sentado para sóleo',                 'Piernas',  'Máquina',         ['Sóleo']],
    ['Tríceps Polea',             'Extensión de tríceps en polea',                           'Brazos',   'Polea',           ['Triceps Polea', 'Tríceps Polea']],
    ['Zercher Squat',             'Sentadilla Zercher con barra en codos',                  'Piernas',  'Barra',           ['Zercher Squat']],
    ['Press Militar Mancuernas Sentado', 'Press militar con mancuernas en posición sentada','Hombros',  'Mancuernas',      ['Press Militar Mancuernas Sentado']],
    ['Press Cerrado Multipower',  'Press de banca con agarre cerrado en Multipower',        'Brazos',   'Multipower',      ['Press Cerrado Multipower']],
    ['Aperturas',                 'Aperturas de pecho en máquina',                          'Pecho',    'Máquina',         ['Aperturas']],
    ['Aductores',                 'Ejercicio de aductores en máquina',                      'Piernas',  'Máquina',         ['Aductores', 'Aductores Máquina']],
    ['Monster Walk con Gomas',    'Caminata lateral con banda elástica',                    'Piernas',  'Banda elástica',  ['Monster Walk Gomas', 'Monster Walk con Gomas']],
    ['Curl Femoral Tumbado',      'Curl de femoral en máquina tumbado',                     'Piernas',  'Máquina',         ['Curl Femoral Tumbado']],
];

$stmtEx   = $db->prepare('INSERT OR IGNORE INTO exercises (canonical_name, description, muscle_group, equipment, adaptations) VALUES (?, ?, ?, ?, ?)');
$stmtAl   = $db->prepare('INSERT OR IGNORE INTO exercise_aliases (exercise_id, alias) VALUES (?, ?)');

foreach ($exercises as [$name, $desc, $group, $equip, $aliases]) {
    $stmtEx->execute([$name, $desc, $group, $equip, '[]']);
    $id = $db->lastInsertId();
    if ($id) {
        foreach ($aliases as $alias) {
            if (strtolower($alias) !== strtolower($name)) {
                $stmtAl->execute([$id, $alias]);
            }
        }
        echo "✓ Ejercicio: $name\n";
    }
}

echo "\n✅ Base de datos inicializada correctamente.\n";
echo "   Admin: admin@fitrackness.com / admin123\n";
echo "   ⚠️  Cambia la contraseña del admin en producción.\n";
