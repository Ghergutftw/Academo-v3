<?php
require_once __DIR__ . '/../_bootstrap.php';

// Accept only POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['id'])) {
    respond(['error' => 'Missing teacher id'], 400);
}

$teacher = new Teacher($db);
$success = $teacher->delete($input['id']);

if ($success) {
    respond(['success' => true]);
} else {
    respond(['error' => 'Delete failed'], 500);
}

