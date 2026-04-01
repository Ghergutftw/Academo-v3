<?php
require_once '../_bootstrap.php';
requireAuth();

$studyGroup = new StudyGroup($db);

if (!isset($_GET['student_id'])) {
    echo json_encode(['success' => false, 'message' => 'Student ID is required']);
    exit;
}

$student_id = $_GET['student_id'];
$result = $studyGroup->getByStudent($student_id);
$study_groups = [];

while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
    $study_groups[] = [
        'id' => $row['id'],
        'name' => $row['name'],
        'course_id' => $row['course_id'],
        'course_name' => $row['course_name'],
        'is_optional' => (bool)$row['is_optional'],
        'teacher_name' => $row['teacher_name'],
        'created_at' => $row['created_at']
    ];
}

echo json_encode(['success' => true, 'data' => $study_groups]);
