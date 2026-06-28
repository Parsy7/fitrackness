#!/usr/bin/env php
<?php

require_once __DIR__ . '/../src/config/config.php';
require_once __DIR__ . '/../src/config/database.php';

$db = Database::connect();

echo "<pre>\n";
echo "Migración 006 — tablas de complementos...\n\n";

$db->exec("
    CREATE TABLE IF NOT EXISTS block_complements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
        sub_block TEXT NOT NULL,
        methodology TEXT NOT NULL,
        parameter TEXT,
        notes TEXT,
        order_index INTEGER DEFAULT 0
    )
");
echo "✓ Tabla block_complements creada\n";

$db->exec("
    CREATE TABLE IF NOT EXISTS block_complement_exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complement_id INTEGER NOT NULL REFERENCES block_complements(id) ON DELETE CASCADE,
        exercise_id INTEGER NOT NULL REFERENCES exercises(id),
        reps TEXT,
        notes TEXT,
        order_index INTEGER DEFAULT 0
    )
");
echo "✓ Tabla block_complement_exercises creada\n";

$db->exec("
    CREATE TABLE IF NOT EXISTS session_complements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        complement_id INTEGER NOT NULL REFERENCES block_complements(id),
        done INTEGER NOT NULL DEFAULT 0,
        observations TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
");
echo "✓ Tabla session_complements creada\n";

echo "\n✅ Listo.\n";
echo "</pre>\n";
