<?php
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['id'], $input['course_id'], $input['session_date'], $input['topic'])) {
    respond(['error' => 'Missing required fields'], 400);
}

$session = new Session($db);
$success = $session->update($input['id'], $input['course_id'], $input['session_date'], $input['topic']);

if ($success) {
    respond(['success' => true]);
} else {
    respond(['error' => 'Update failed'], 500);
}

