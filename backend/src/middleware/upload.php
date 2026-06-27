<?php

function handle_upload(string $field, array $allowedTypes): ?string {
    if (!isset($_FILES[$field]) || $_FILES[$field]['error'] !== UPLOAD_ERR_OK) {
        return null;
    }

    $file = $_FILES[$field];

    if ($file['size'] > MAX_UPLOAD_SIZE) {
        json_error('File too large. Maximum ' . (MAX_UPLOAD_SIZE / 1024 / 1024) . 'MB');
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = $finfo->file($file['tmp_name']);

    if (!in_array($mime, $allowedTypes)) {
        json_error('File type not allowed: ' . $mime);
    }

    $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = bin2hex(random_bytes(16)) . '.' . $ext;
    $subdir   = date('Y/m');
    $dir      = UPLOAD_DIR . $subdir . '/';

    if (!is_dir($dir)) mkdir($dir, 0755, true);

    $dest = $dir . $filename;
    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        json_error('Failed to save file', 500);
    }

    return $subdir . '/' . $filename;
}

function delete_upload(string $path): void {
    $full = UPLOAD_DIR . $path;
    if (file_exists($full)) unlink($full);
}
