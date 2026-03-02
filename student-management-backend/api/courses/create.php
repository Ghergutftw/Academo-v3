<?php
require_once __DIR__ . '/../_bootstrap.php';
require_once __DIR__ . '/../../models/Laboratory.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['name'], $input['teacher_id'])) {
    respond(['error' => 'Missing required fields: name, teacher_id'], 400);
}

$description = $input['description'] ?? '';

$course = new Courses($db);
$newId = $course->create($input['name'], $description, $input['teacher_id']);

if ($newId) {
    $laboratory = new Laboratory($db);
    $laboratory->createForCourse($newId);

    $createdCourse = $course->getById($newId);
    respond($createdCourse, 201);
} else {
    respond(['error' => 'Failed to create course'], 500);
}

