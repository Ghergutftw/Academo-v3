<?php
require_once __DIR__ . '/../_bootstrap.php';
require_once __DIR__ . '/../../models/Sessions.php';
require_once __DIR__ . '/../../models/Laboratory.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_input();
$course_id = $input['course_id'] ?? null;
$group_id = $input['group_id'] ?? null;
$laboratory_number = $input['laboratory_number'] ?? null;
$session_date = $input['session_date'] ?? null;

if (!$course_id || !$group_id || !$laboratory_number || !$session_date) {
    respond(['error' => 'course_id, group_id, laboratory_number and session_date are required'], 400);
}

// Get the laboratory topic
$laboratory = new Laboratory($db);
$lab = $laboratory->getByNumber($course_id, $laboratory_number);

if (!$lab) {
    respond(['error' => 'Laboratory not found'], 404);
}

$session = new Session($db);
$session->course_id = $course_id;
$session->group_id = $group_id;
$session->laboratory_number = $laboratory_number;
$session->session_date = $session_date;
$session->topic = $lab['topic'];

if ($session->create()) {
    $sessionId = $db->lastInsertId();
    respond(['id' => (int)$sessionId, 'message' => 'Session created successfully'], 201);
} else {
    respond(['error' => 'Failed to create session'], 500);
}

