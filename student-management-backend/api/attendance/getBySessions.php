<?php
require_once '../_bootstrap.php';

$session_ids = $_GET['session_ids'] ?? '';

if (empty($session_ids)) {
    respond(['error' => 'session_ids parameter is required'], 400);
}

$ids_array = array_map('intval', explode(',', $session_ids));

if (empty($ids_array)) {
    respond(['error' => 'Invalid session_ids format'], 400);
}

$attendanceModel = new Attendance($db);

try {
    $records = $attendanceModel->getBySessions($ids_array);
    respond($records);
} catch (Exception $e) {
    respond(['error' => 'Failed to fetch attendance records', 'details' => $e->getMessage()], 500);
}