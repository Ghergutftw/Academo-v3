<?php
require_once __DIR__ . '/../_bootstrap.php';
require_once __DIR__ . '/../../models/Laboratory.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_input();
$id = $input['id'] ?? null;
$topic = $input['topic'] ?? null;

if (!$id || !$topic) {
    respond(['error' => 'id and topic are required'], 400);
}

try {
    $laboratory = new Laboratory($db);
    if ($laboratory->updateTopic($id, $topic)) {
        respond(['success' => true, 'message' => 'Laboratory topic updated successfully']);
    } else {
        respond(['error' => 'Failed to update laboratory topic'], 500);
    }
} catch (Exception $e) {
    respond(['error' => 'Failed to update laboratory: ' . $e->getMessage()], 500);
}

