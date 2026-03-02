<?php
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['id'], $input['name'], $input['email'], $input['group_id'])) {
    respond(['error' => 'Missing required fields'], 400);
}

$password = $input['password'] ?? null; // Optional password update

$student = new Student($db);
$success = $student->update(
    $input['id'],
    $input['name'],
    $input['email'],
    $input['group_id'],
    $password,
    $input['start_year'],
    $input['study_cycle'],
    $input['study_year'],
    $input['financing_type'],
    $input['student_status']
);

if ($success) {
    respond(['success' => true]);
} else {
    respond(['error' => 'Update failed'], 500);
}

