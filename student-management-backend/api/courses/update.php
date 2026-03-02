<?php
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['id'], $input['name'], $input['teacher_id'])) {
    respond(['error' => 'Missing required fields: id, name, teacher_id'], 400);
}

$description = $input['description'] ?? '';

$course = new Courses($db);
$success = $course->update($input['id'], $input['name'], $description, $input['teacher_id']);

if ($success) {
    respond(['success' => true]);
} else {
    respond(['error' => 'Update failed'], 500);
}

