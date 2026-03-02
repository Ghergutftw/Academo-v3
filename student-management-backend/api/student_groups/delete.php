<?php
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['id'])) {
    respond(['error' => 'Missing group id'], 400);
}

$group = new Group($db);
$success = $group->delete($input['id']);

if ($success) {
    respond(['success' => true]);
} else {
    respond(['error' => 'Delete failed'], 500);
}

