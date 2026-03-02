<?php
require_once '../_bootstrap.php';

requireAuth(['admin', 'teacher']);

$labInstructor = new CourseLabInstructor($db);

$course_id = $_GET['course_id'] ?? null;

if (!$course_id) {
    http_response_code(400);
    echo json_encode(["message" => "Course ID is required"]);
    exit;
}

$instructors = $labInstructor->getByCourse($course_id);

http_response_code(200);
echo json_encode($instructors);
