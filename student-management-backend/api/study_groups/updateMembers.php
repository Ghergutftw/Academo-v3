<?php
require_once '../_bootstrap.php';
requireAuth();

$rawInput = file_get_contents("php://input");
error_log("updateMembers raw input: " . $rawInput);

$data = json_decode($rawInput);

if (!isset($data->study_group_id)) {
    echo json_encode(['success' => false, 'message' => 'Study group ID is required']);
    exit;
}

if (!isset($data->student_ids) || !is_array($data->student_ids)) {
    echo json_encode(['success' => false, 'message' => 'Student IDs must be an array', 'received' => $data]);
    exit;
}

// Convert to integers
$studentIds = array_map('intval', $data->student_ids);
$groupId = intval($data->study_group_id);

error_log("Processing group $groupId with students: " . json_encode($studentIds));

$studyGroupMember = new StudyGroupMember($db);

if ($studyGroupMember->replaceMembers($groupId, $studentIds)) {
    echo json_encode([
        'success' => true,
        'message' => 'Study group members updated successfully',
        'group_id' => $groupId,
        'student_count' => count($studentIds)
    ]);
} else {
    echo json_encode([
        'success' => false, 
        'message' => 'Failed to update study group members',
        'group_id' => $groupId
    ]);
}
