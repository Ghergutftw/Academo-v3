<?php
require_once __DIR__ . '/../_bootstrap.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

$studentId = $_GET['student_id'] ?? null;
if (!$studentId) respond(['error' => 'student_id is required'], 400);

// Get courses for a student based on their group, including teacher names
$sql = "SELECT c.*, t.name as teacher_name 
        FROM courses c
        JOIN group_courses gc ON gc.course_id = c.id
        JOIN students s ON s.group_id = gc.group_id
        LEFT JOIN teachers t ON t.id = c.teacher_id
        WHERE s.id = ?
        ORDER BY c.name";
$stmt = $db->prepare($sql);
$stmt->execute([$studentId]);
respond($stmt->fetchAll(PDO::FETCH_ASSOC));
