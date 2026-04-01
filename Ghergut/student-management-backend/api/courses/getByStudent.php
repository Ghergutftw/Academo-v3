<?php
require_once __DIR__ . '/../_bootstrap.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

$studentId = $_GET['student_id'] ?? null;
if (!$studentId) {
    respond(['error' => 'student_id is required'], 400);
}

$courseModel = new Courses($db);
$courses = $courseModel->getStudentCoursesWithInstructors($studentId);

// Normalize course_file in each course if present
foreach ($courses as &$c) {
    if (!empty($c['course_file'])) {
        $c['course_file'] = basename($c['course_file']);
    }
    // also normalize lab_instructors subarray if needed (no change to their fields)
}

respond($courses);