<?php
require_once __DIR__ . '/../_bootstrap.php';
require_once __DIR__ . '/../../models/Sessions.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

$courseId = $_GET['course_id'] ?? null;

if (!$courseId) {
    respond(['error' => 'course_id is required'], 400);
}

$session = new Session($db);
$stmt = $session->getByCourse($courseId);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
respond($rows);

