<?php
require_once __DIR__ . '/../_bootstrap.php';
require_once __DIR__ . '/../../models/Laboratory.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

$courseId = $_GET['course_id'] ?? null;

if (!$courseId) {
    respond(['error' => 'course_id is required'], 400);
}

try {
    $laboratory = new Laboratory($db);
    $labs = $laboratory->getByCourse($courseId);
    respond($labs);
} catch (Exception $e) {
    respond(['error' => 'Failed to get laboratories: ' . $e->getMessage()], 500);
}

