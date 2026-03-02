<?php
require_once '../_bootstrap.php';
requireAuth();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->name) || !isset($data->course_id)) {
    echo json_encode(['success' => false, 'message' => 'Name and course_id are required']);
    exit;
}

$studyGroup = new StudyGroup($db);
$studyGroup->name = $data->name;
$studyGroup->course_id = $data->course_id;

if ($studyGroup->create()) {
    // Add initial members if provided
    if (isset($data->student_ids) && is_array($data->student_ids) && count($data->student_ids) > 0) {
        $studyGroupMember = new StudyGroupMember($db);
        $studyGroupMember->addStudents($studyGroup->id, $data->student_ids);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Study group created successfully',
        'id' => $studyGroup->id
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to create study group']);
}
