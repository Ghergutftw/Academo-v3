<?php
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['id'])) {
    respond(['error' => 'Missing attendance id'], 400);
}

$attendance = new Attendance($db);
$success = $attendance->delete($input['id']);

if ($success) {
    respond(['success' => true]);
} else {
    respond(['error' => 'Delete failed'], 500);
}

