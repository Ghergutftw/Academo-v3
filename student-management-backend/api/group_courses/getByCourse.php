<?php
require_once __DIR__ . '/../_bootstrap.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

$courseId = $_GET['course_id'] ?? null;

if (!$courseId) {
    respond(['error' => 'course_id is required'], 400);
}

try {
    $query = "SELECT * FROM group_courses WHERE course_id = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$courseId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    respond($rows);
} catch (Exception $e) {
    respond(['error' => 'Failed to get group courses: ' . $e->getMessage()], 500);
}

