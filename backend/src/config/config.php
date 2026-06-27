<?php

define('DB_PATH', __DIR__ . '/../../database/fitrackness.db');
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'change_this_secret_in_production');
define('JWT_EXPIRY', 60 * 60 * 24 * 7); // 7 días
define('UPLOAD_DIR', __DIR__ . '/../../uploads/');
define('MAX_UPLOAD_SIZE', 20 * 1024 * 1024); // 20MB
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/webp']);
define('ALLOWED_VIDEO_TYPES', ['video/mp4', 'video/quicktime', 'video/webm']);
define('ANTHROPIC_API_KEY', getenv('ANTHROPIC_API_KEY') ?: '');
define('ANTHROPIC_MODEL', 'claude-sonnet-4-6');
