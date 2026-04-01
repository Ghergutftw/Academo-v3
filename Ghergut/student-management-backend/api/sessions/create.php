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
$study_group_id = $input['study_group_id'] ?? null;
$laboratory_number = $input['laboratory_number'] ?? null;
$session_date = $input['session_date'] ?? null;

if (!$course_id || !$study_group_id || !$laboratory_number) {
    respond(['error' => 'course_id, study_group_id and laboratory_number are required'], 400);
}

// If no session_date provided or only date without time, use current datetime
if (!$session_date) {
    $session_date = date('Y-m-d H:i:s');
} else {
    // Check if session_date contains time, if not add current time
    $dateTime = new DateTime($session_date);
    if ($dateTime->format('H:i:s') === '00:00:00') {
        // Only date was provided, add current time
        $session_date = date('Y-m-d') . ' ' . date('H:i:s');
    }
}

// Get the laboratory topic
$laboratory = new Laboratory($db);
$lab = $laboratory->getByNumber($course_id, $laboratory_number);

if (!$lab) {
    respond(['error' => 'Laboratory not found'], 404);
}

$session = new Session($db);
$session->course_id = $course_id;
$session->study_group_id = $study_group_id;
$session->laboratory_number = $laboratory_number;
$session->session_date = $session_date;
$session->topic = $lab['topic'];

if ($session->create()) {
    $sessionId = $db->lastInsertId();
    respond(['id' => (int)$sessionId, 'message' => 'Session created successfully'], 201);
} else {
    respond(['error' => 'Failed to create session'], 500);
}

