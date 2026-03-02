<?php
require_once '../_bootstrap.php';

requireAuth(['admin']);

$labInstructor = new CourseLabInstructor($db);

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->course_id) || !isset($data->teacher_ids)) {
    http_response_code(400);
    echo json_encode(["message" => "Course ID and teacher IDs are required"]);
    exit;
}

$success = $labInstructor->updateByCourse($data->course_id, $data->teacher_ids);

if ($success) {
    http_response_code(200);
    echo json_encode(["message" => "Lab instructors updated successfully"]);
} else {
    http_response_code(500);
    echo json_encode(["message" => "Failed to update lab instructors"]);
}
