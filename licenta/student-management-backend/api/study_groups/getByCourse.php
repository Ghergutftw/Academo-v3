<?php
require_once '../_bootstrap.php';
requireAuth();

$studyGroup = new StudyGroup($db);

if (!isset($_GET['course_id'])) {
    echo json_encode(['success' => false, 'message' => 'Course ID is required']);
    exit;
}

$course_id = $_GET['course_id'];
$result = $studyGroup->getByCourse($course_id);
$study_groups = [];

while ($row = $result->fetch(PDO::FETCH_ASSOC)) {
    $study_groups[] = [
        'id' => $row['id'],
        'name' => $row['name'],
        'course_id' => $row['course_id'],
        'student_count' => $row['student_count'],
        'created_at' => $row['created_at']
    ];
}

echo json_encode($study_groups);
