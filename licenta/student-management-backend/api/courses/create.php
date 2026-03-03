<?php
require_once __DIR__ . '/../_bootstrap.php';
require_once __DIR__ . '/../../models/Laboratory.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['name'], $input['acronym'], $input['teacher_id'], $input['year'], $input['semester'])) {
    respond(['error' => 'Missing required fields: name, acronym, teacher_id, year, semester'], 400);
}

$acronym = trim($input['acronym']);
if ($acronym === '' || strlen($acronym) > 16) {
    respond(['error' => 'Acronym is required and must be max 16 chars'], 400);
}

$year = (int)$input['year'];
$semester = (int)$input['semester'];
$is_optional = isset($input['is_optional']) ? (bool)$input['is_optional'] : false;

// Validate year and semester
if ($year < 1 || $year > 6) {
    respond(['error' => 'Year must be between 1 and 6 (1-4 for Bachelor, 5-6 for Master)'], 400);
}
if ($semester < 1 || $semester > 2) {
    respond(['error' => 'Semester must be 1 or 2'], 400);
}

$course = new Courses($db);
$newId = $course->create($input['name'], $acronym, $input['teacher_id'], $year, $semester, $is_optional);

if ($newId) {
    $laboratory = new Laboratory($db);
    $laboratory->createForCourse($newId);

    $createdCourse = $course->getById($newId);
    respond($createdCourse, 201);
} else {
    respond(['error' => 'Failed to create course'], 500);
}

