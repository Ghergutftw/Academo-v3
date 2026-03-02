<?php
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_input();
if (!isset($input['id'])) {
    respond(['error' => 'Missing group_course id'], 400);
}

$groupCourse = new GroupCourse($db);
$success = $groupCourse->delete($input['id']);

if ($success) {
    respond(['success' => true]);
} else {
    respond(['error' => 'Delete failed'], 500);
}
