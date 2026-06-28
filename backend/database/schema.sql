-- ============================================
-- FITRACKNESS - Schema de base de datos SQLite
-- ============================================

PRAGMA foreign_keys = ON;

-- Usuarios
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
    birth_date DATE,
    age INTEGER, -- calculado automáticamente si hay birth_date, editable si no
    sex TEXT CHECK(sex IN ('male', 'female', 'undisclosed')),
    height_cm REAL,
    weight_kg REAL,
    conditions TEXT, -- JSON array de dolencias/lesiones/condiciones
    avatar_url TEXT, -- foto de perfil subida por el usuario
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ejercicios (biblioteca global)
CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    canonical_name TEXT NOT NULL UNIQUE,
    description TEXT,
    muscle_group TEXT,
    equipment TEXT,
    adaptations TEXT, -- JSON array de adaptaciones posibles
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Alias/variantes de nombres de ejercicios
CREATE TABLE IF NOT EXISTS exercise_aliases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    alias TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Medios de referencia de ejercicios (fotos/vídeos de cómo se ejecuta)
CREATE TABLE IF NOT EXISTS exercise_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK(type IN ('photo', 'video')),
    url TEXT NOT NULL,
    caption TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bloques de entrenamiento
CREATE TABLE IF NOT EXISTS blocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ejercicios dentro de un bloque con parámetros recomendados
CREATE TABLE IF NOT EXISTS block_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id),
    sub_block TEXT, -- A, B, C, D
    recommended_sets INTEGER,
    recommended_reps TEXT, -- puede ser "8-10" o "12" o "10/8/6"
    recommended_rest_seconds INTEGER,
    notes TEXT,
    order_index INTEGER DEFAULT 0
);

-- Sesiones de entrenamiento
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    block_id INTEGER REFERENCES blocks(id),
    session_date DATE NOT NULL,
    type TEXT NOT NULL DEFAULT 'block' CHECK(type IN ('block', 'group')),
    general_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Registro real de ejercicios en una sesión
CREATE TABLE IF NOT EXISTS session_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id),
    block_exercise_id INTEGER REFERENCES block_exercises(id),
    sets_done INTEGER,
    reps_done TEXT, -- puede ser "10,9,8" por serie
    weight_kg REAL,
    rpe INTEGER CHECK(rpe BETWEEN 1 AND 10), -- esfuerzo percibido
    adaptation TEXT, -- adaptación específica ese día
    notes TEXT,
    order_index INTEGER DEFAULT 0
);

-- Medios asociados al ejercicio en una sesión (fotos/vídeos de cómo lo ejecutaste tú)
CREATE TABLE IF NOT EXISTS session_exercise_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_exercise_id INTEGER NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK(type IN ('photo', 'video')),
    url TEXT NOT NULL,
    caption TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Récords personales (se actualizan automáticamente)
CREATE TABLE IF NOT EXISTS personal_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id),
    weight_kg REAL NOT NULL,
    reps TEXT,
    achieved_at DATE NOT NULL,
    session_id INTEGER REFERENCES sessions(id),
    UNIQUE(user_id, exercise_id)
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON sessions(user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_session_exercises_session ON session_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_block_exercises_block ON block_exercises(block_id);
CREATE INDEX IF NOT EXISTS idx_exercise_aliases_exercise ON exercise_aliases(exercise_id);
CREATE INDEX IF NOT EXISTS idx_blocks_start_date ON blocks(start_date);
