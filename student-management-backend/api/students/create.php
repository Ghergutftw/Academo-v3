<?php
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['name'], $input['email'], $input['group_id'])) {
    respond(['error' => 'Missing required fields: name, email, group_id'], 400);
}

$student = new Student($db);
$newId = $student->create($input['name'], $input['email'], $input['group_id']);

if ($newId) {
    $createdStudent = $student->getById($newId);
    respond($createdStudent, 201);
} else {
    respond(['error' => 'Failed to create student'], 500);
}

