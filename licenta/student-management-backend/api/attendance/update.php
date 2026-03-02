<?php
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['id'], $input['student_id'], $input['session_id'], $input['status'])) {
    respond(['error' => 'Missing required fields'], 400);
}

$attendance = new Attendance($db);
$success = $attendance->update($input['id'], $input['student_id'], $input['session_id'], $input['status']);

if ($success) {
    respond(['success' => true]);
} else {
    respond(['error' => 'Update failed'], 500);
}

