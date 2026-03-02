<?php
require_once __DIR__ . '/../_bootstrap.php';
if (!isset($db)) {
    $db = (new Database())->getConnection();
}

// Get group_id from query parameter
$groupId = $_GET['group_id'] ?? null;

if ($groupId === null || $groupId === '') {
    respond(['error' => 'Missing group_id'], 400);
}

$groupId = intval($groupId);

if ($groupId === 0) {
    respond(['error' => 'Invalid group_id'], 400);
}
$student = new Student($db);
$stmt = $student->getByGroup($groupId);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
respond($rows);
