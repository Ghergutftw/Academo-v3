<?php
require_once __DIR__ . '/../_bootstrap.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

$studentId = $_GET['student_id'] ?? null;

if (!$studentId) {
    respond(['error' => 'student_id is required'], 400);
}

$attendanceModel = new Attendance($db);

try {
    $stats = $attendanceModel->getStatsByStudent($studentId);
    respond($stats);
} catch (Exception $e) {
    respond(['error' => 'Failed to get attendance statistics: ' . $e->getMessage()], 500);
}