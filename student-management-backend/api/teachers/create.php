<?php
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['name'], $input['email'])) {
    respond(['error' => 'Missing required fields: name, email'], 400);
}

$teacher = new Teacher($db);
$newId = $teacher->create($input['name'], $input['email']);

if ($newId) {
    $createdTeacher = $teacher->getById($newId);
    respond($createdTeacher, 201);
} else {
    respond(['error' => 'Failed to create teacher'], 500);
}

