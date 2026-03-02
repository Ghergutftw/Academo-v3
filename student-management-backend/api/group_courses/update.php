<?php
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_input();
if (!isset($input['id'], $input['group_id'], $input['course_id'])) {
    respond(['error' => 'Missing required fields'], 400);
}

$groupCourse = new GroupCourse($db);
$success = $groupCourse->update($input['id'], $input['group_id'], $input['course_id']);

if ($success) {
    respond(['success' => true]);
} else {
    respond(['error' => 'Update failed'], 500);
}
