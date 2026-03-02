<?php
require_once '../_bootstrap.php';
require_once '../../models/StudyGroup.php';
requireAuth();

if (!isset($_GET['study_group_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'study_group_id parameter is required']);
    exit();
}

$study_group_id = intval($_GET['study_group_id']);

$studyGroup = new StudyGroup($db);
$result = $studyGroup->getStudents($study_group_id);

$students = [];
while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
    $students[] = [
        'id' => $row['id'],
        'name' => $row['name'],
        'email' => $row['email'],
        'group_id' => $row['group_id'],
        'group_name' => $row['group_name']
    ];
}

echo json_encode($students);
