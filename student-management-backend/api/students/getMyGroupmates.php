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
$result = $studentModel->getMyGroupmates($studentId);

if (!$result) {
    respond(['error' => 'Student not found or not assigned to a group'], 404);
}

respond($result);