<?php
require_once __DIR__ . '/../_bootstrap.php';

$body = json_input();
$sessionId = filter_var($body['session_id'] ?? null, FILTER_VALIDATE_INT);
$records = $body['records'] ?? [];

if (!$sessionId || !is_array($records)) {
    respond(['error' => 'Valid session_id and records array are required'], 400);
}

$attendanceModel = new Attendance($db);

if ($attendanceModel->save($sessionId, $records)) {
    respond(['status' => 'success']);
} else {
    respond(['error' => 'Failed to save attendance'], 500);
}