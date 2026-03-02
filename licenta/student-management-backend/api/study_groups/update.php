<?php
require_once '../_bootstrap.php';
requireAuth();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id) || !isset($data->name) || !isset($data->course_id)) {
    echo json_encode(['success' => false, 'message' => 'ID, name, and course_id are required']);
    exit;
}

$studyGroup = new StudyGroup($db);
$studyGroup->id = $data->id;
$studyGroup->name = $data->name;
$studyGroup->course_id = $data->course_id;

if ($studyGroup->update()) {
    echo json_encode([
        'success' => true,
        'message' => 'Study group updated successfully'
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to update study group']);
}
