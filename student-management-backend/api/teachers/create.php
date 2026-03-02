<?php
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['name'], $input['email'])) {
    respond(['error' => 'Missing required fields: name, email'], 400);
}

// Generate default password if not provided
$password = $input['password'] ?? 'teacher123';
$is_admin = $input['is_admin'] ?? false;

$teacher = new Teacher($db);
$newId = $teacher->create($input['name'], $input['email'], $password, $is_admin);

if ($newId) {
    $createdTeacher = $teacher->getById($newId);
    respond($createdTeacher, 201);
} else {
    respond(['error' => 'Failed to create teacher'], 500);
}

