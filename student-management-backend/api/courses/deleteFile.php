<?php
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['course_id'])) {
    respond(['error' => 'Course ID is required'], 400);
}

$courseId = (int)$input['course_id'];

// Check if course exists and has a file
$courseModel = new Courses($db);
$course = $courseModel->getById($courseId);
if (!$course) {
    respond(['error' => 'Course not found'], 404);
}

if (empty($course['course_file'])) {
    respond(['error' => 'No file associated with this course'], 404);
}

$fileName = $course['course_file'];
$filePath = __DIR__ . '/../../uploads/course_files/' . $fileName;

// Remove file from filesystem
if (file_exists($filePath)) {
    if (!unlink($filePath)) {
        respond(['error' => 'Failed to delete file from server'], 500);
    }
}

// Update database to remove file reference
$query = "UPDATE courses SET course_file = NULL WHERE id = :id";
$stmt = $db->prepare($query);

if ($stmt->execute([':id' => $courseId])) {
    respond(['success' => true, 'message' => 'File deleted successfully']);
} else {
    respond(['error' => 'Failed to update database'], 500);
}