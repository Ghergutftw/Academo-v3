<?php
require_once __DIR__ . '/../_bootstrap.php';
if (!isset($db)) {
    $db = (new Database())->getConnection();
}

$groupId = $_GET['group_id'] ?? null;
$studyGroupId = $_GET['study_group_id'] ?? null;

$student = new Student($db);

if ($studyGroupId) {
    $studyGroupId = intval($studyGroupId);
    if ($studyGroupId === 0) {
        respond(['error' => 'Invalid study_group_id'], 400);
    }

    $stmt = $student->getByStudyGroup($studyGroupId);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    respond($rows);
} elseif ($groupId) {
    $groupId = intval($groupId);
    if ($groupId === 0) {
        respond(['error' => 'Invalid group_id'], 400);
    }

    $stmt = $student->getByGroup($groupId);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    respond($rows);
} else {
    respond(['error' => 'Missing group_id or study_group_id'], 400);
}