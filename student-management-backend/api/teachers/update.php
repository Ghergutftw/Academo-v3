<?php
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['id'], $input['name'], $input['email'])) {
    respond(['error' => 'Missing required fields'], 400);
}

$teacher = new Teacher($db);
$success = $teacher->update($input['id'], $input['name'], $input['email']);

if ($success) {
    respond(['success' => true]);
} else {
    respond(['error' => 'Update failed'], 500);
}
