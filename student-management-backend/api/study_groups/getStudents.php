<?php
require_once '../_bootstrap.php';
requireAuth();

$studyGroup = new StudyGroup($db);

if (!isset($_GET['id'])) {
    echo json_encode(['success' => false, 'message' => 'Study group ID is required']);
    exit;
}

$id = $_GET['id'];
$result = $studyGroup->getStudents($id);
$students = [];

while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
    $students[] = [
        'id' => $row['id'],
        'name' => $row['name'],
        'email' => $row['email'],
        'group_id' => $row['group_id'],
        'group_name' => $row['group_name'],
        'created_at' => $row['created_at']
    ];
}

echo json_encode(['success' => true, 'data' => $students]);
