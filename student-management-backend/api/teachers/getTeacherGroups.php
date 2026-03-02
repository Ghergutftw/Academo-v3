<?php
require_once __DIR__ . '/../_bootstrap.php';
require_once __DIR__ . '/../../models/Teacher.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

$teacherId = $_GET['teacher_id'] ?? null;
if (!$teacherId) {
    respond(['error' => 'teacher_id is required'], 400);
}

try {
    $teacher = new Teacher($db);
    $groups = $teacher->getTaughtGroups((int)$teacherId);
    respond($groups);
} catch (Exception $e) {
    respond(['error' => 'Failed to fetch taught groups: ' . $e->getMessage()], 500);
}