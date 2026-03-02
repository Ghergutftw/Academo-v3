<?php
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['id'], $input['name'], $input['teacher_id'], $input['year'], $input['semester'])) {
    respond(['error' => 'Missing required fields: id, name, teacher_id, year, semester'], 400);
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
$success = $course->update($input['id'], $input['name'], $input['teacher_id'], $year, $semester, $is_optional);

if ($success) {
    respond(['success' => true]);
} else {
    respond(['error' => 'Update failed'], 500);
}

