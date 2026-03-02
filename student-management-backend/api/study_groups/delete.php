<?php
require_once '../_bootstrap.php';
requireAuth();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->id)) {
    echo json_encode(['success' => false, 'message' => 'Study group ID is required']);
    exit;
}

$studyGroup = new StudyGroup($db);
$studyGroup->id = $data->id;

if ($studyGroup->delete()) {
    echo json_encode([
        'success' => true,
        'message' => 'Study group deleted successfully'
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to delete study group']);
}
