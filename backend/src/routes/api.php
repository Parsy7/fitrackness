<?php

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../config/helpers.php';
require_once __DIR__ . '/../middleware/upload.php';
require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/UserController.php';
require_once __DIR__ . '/../controllers/ExerciseController.php';
require_once __DIR__ . '/../controllers/BlockController.php';
require_once __DIR__ . '/../controllers/SessionController.php';
require_once __DIR__ . '/../controllers/StatsController.php';

$db      = Database::connect();
$method  = $_SERVER['REQUEST_METHOD'];
$uri     = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Eliminar el prefijo del subdirectorio para que funcione en cualquier ruta base
// Ej: /sites/fitrackness/backend/auth/login -> /auth/login
$scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
if ($scriptDir && str_starts_with($uri, $scriptDir)) {
    $uri = substr($uri, strlen($scriptDir));
}
$uri   = preg_replace('#^/api#', '', $uri) ?: '/';
$parts = explode('/', trim($uri, '/'));
if ($parts === ['']) $parts = [];

// Instanciar controladores
$auth    = new AuthController($db);
$users   = new UserController($db);
$exercises = new ExerciseController($db);
$blocks  = new BlockController($db);
$sessions = new SessionController($db);
$stats   = new StatsController($db);

// ──────────────────────────────────────────────
// RUTAS
// ──────────────────────────────────────────────

// Auth
if ($parts[0] === 'auth') {
    match([$method, $parts[1] ?? '']) {
        ['POST', 'login']    => $auth->login(),
        ['POST', 'register'] => $auth->register(),
        ['GET',  'me']       => $auth->me(),
        default              => json_error('Not found', 404),
    };
}

// Users
elseif ($parts[0] === 'users') {
    match([$method, $parts[1] ?? '']) {
        ['PUT', 'profile'] => $users->updateProfile(),
        default            => json_error('Not found', 404),
    };
}

// Admin users
elseif ($parts[0] === 'admin' && $parts[1] === 'users') {
    $id = isset($parts[2]) ? (int)$parts[2] : null;
    match([$method, $id !== null]) {
        ['GET',    false] => $users->listUsers(),
        ['GET',    true]  => $users->getUser($id),
        ['DELETE', true]  => $users->deleteUser($id),
        default           => json_error('Not found', 404),
    };
}

// Exercises
elseif ($parts[0] === 'exercises') {
    $id      = isset($parts[1]) && is_numeric($parts[1]) ? (int)$parts[1] : null;
    $sub     = $parts[2] ?? null;
    $mediaId = isset($parts[3]) && is_numeric($parts[3]) ? (int)$parts[3] : null;

    if ($id && $sub === 'media') {
        match([$method, $mediaId !== null]) {
            ['POST',   false] => $exercises->addMedia($id),
            ['DELETE', true]  => $exercises->deleteMedia($id, $mediaId),
            default           => json_error('Not found', 404),
        };
    } else {
        match([$method, $id !== null]) {
            ['GET',    false] => $exercises->list(),
            ['POST',   false] => $exercises->create(),
            ['GET',    true]  => $exercises->get($id),
            ['PUT',    true]  => $exercises->update($id),
            ['DELETE', true]  => $exercises->delete($id),
            default           => json_error('Not found', 404),
        };
    }
}

// Blocks
elseif ($parts[0] === 'blocks') {
    $id  = isset($parts[1]) && is_numeric($parts[1]) ? (int)$parts[1] : null;
    $sub = $parts[1] ?? null;

    if ($sub === 'active') {
        $blocks->active();
    } elseif ($sub === 'import-image') {
        $blocks->importFromImage();
    } elseif ($sub === 'import-confirm') {
        $blocks->importConfirm();
    } else {
        match([$method, $id !== null]) {
            ['GET',    false] => $blocks->list(),
            ['POST',   false] => $blocks->create(),
            ['GET',    true]  => $blocks->get($id),
            ['PUT',    true]  => $blocks->update($id),
            ['DELETE', true]  => $blocks->delete($id),
            default           => json_error('Not found', 404),
        };
    }
}

// Sessions
elseif ($parts[0] === 'sessions') {
    $sessionId = isset($parts[1]) && is_numeric($parts[1]) ? (int)$parts[1] : null;
    $sub       = $parts[2] ?? null;
    $seId      = isset($parts[3]) && is_numeric($parts[3]) ? (int)$parts[3] : null;
    $mediaSub  = $parts[4] ?? null;
    $mediaId   = isset($parts[5]) && is_numeric($parts[5]) ? (int)$parts[5] : null;

    if ($sessionId && $sub === 'exercises') {
        if ($seId && $mediaSub === 'media') {
            match([$method, $mediaId !== null]) {
                ['POST',   false] => $sessions->addExerciseMedia($sessionId, $seId),
                ['DELETE', true]  => $sessions->deleteExerciseMedia($sessionId, $seId, $mediaId),
                default           => json_error('Not found', 404),
            };
        } elseif ($seId) {
            match($method) {
                'PUT'    => $sessions->updateExercise($sessionId, $seId),
                'DELETE' => $sessions->deleteExercise($sessionId, $seId),
                default  => json_error('Not found', 404),
            };
        } else {
            match($method) {
                'POST'  => $sessions->addExercise($sessionId),
                default => json_error('Not found', 404),
            };
        }
    } else {
        match([$method, $sessionId !== null]) {
            ['GET',    false] => $sessions->list(),
            ['POST',   false] => $sessions->create(),
            ['GET',    true]  => $sessions->get($sessionId),
            ['PUT',    true]  => $sessions->update($sessionId),
            ['DELETE', true]  => $sessions->delete($sessionId),
            default           => json_error('Not found', 404),
        };
    }
}

// Stats
elseif ($parts[0] === 'stats') {
    $sub = $parts[1] ?? '';
    $id  = isset($parts[2]) && is_numeric($parts[2]) ? (int)$parts[2] : null;

    match([$method, $sub]) {
        ['GET', 'overview']  => $stats->overview(),
        ['GET', 'prs']       => $stats->personalRecords(),
        ['GET', 'volume']    => $stats->volume(),
        ['GET', 'exercise']  => $id ? $stats->exerciseProgress($id) : json_error('Exercise id required', 400),
        default              => json_error('Not found', 404),
    };
}

// Admin stats
elseif ($parts[0] === 'admin' && $parts[1] === 'stats') {
    match([$method, $parts[2] ?? '']) {
        ['GET', 'users'] => $stats->adminUsersOverview(),
        default          => json_error('Not found', 404),
    };
}

else {
    json_error('Not found', 404);
}
