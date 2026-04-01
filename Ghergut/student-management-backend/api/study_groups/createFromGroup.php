<?php
require_once '../_bootstrap.php';
require_once '../../models/StudyGroup.php';
requireAuth();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->course_id, $data->group_id)) {
    http_response_code(400);
    echo json_encode(['error' => 'course_id and group_id are required']);
    exit();
}

$course_id = intval($data->course_id);
$group_id = intval($data->group_id);

try {
    $stmt = $db->prepare("SELECT name FROM student_groups WHERE id = ?");
    $stmt->execute([$group_id]);
    $adminGroup = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$adminGroup) {
        http_response_code(404);
        echo json_encode(['error' => 'StudentGroups not found']);
        exit();
    }

    $studyGroup = new StudyGroup($db);
    $existing = $studyGroup->findByNameAndCourse($adminGroup['name'], $course_id);

    if ($existing) {
        echo json_encode([
            'id' => $existing['id'],
            'name' => $existing['name'],
            'course_id' => $course_id,
            'created' => false
        ]);
        exit();
    }

    $studyGroup->name = $adminGroup['name'];
    $studyGroup->course_id = $course_id;

    if ($studyGroup->create()) {
        $studyGroup->addStudentsFromAdminGroup($group_id);

        echo json_encode([
            'id' => $studyGroup->id,
            'name' => $studyGroup->name,
            'course_id' => $course_id,
            'created' => true
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create study group']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}