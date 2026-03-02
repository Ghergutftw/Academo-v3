<?php
require_once __DIR__ . '/../_bootstrap.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

$studentId = $_GET['student_id'] ?? null;
if (!$studentId) {
    respond(['error' => 'student_id is required'], 400);
}

$studentModel = new Student($db);
$groups = $studentModel->getStudentGroups($studentId);

respond($groups);