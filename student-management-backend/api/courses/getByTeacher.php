<?php
require_once __DIR__ . '/../_bootstrap.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

$teacherId = $_GET['teacher_id'] ?? null;
if (!$teacherId) respond(['error' => 'teacher_id is required'], 400);

$course = new Courses($db);
$stmt = $course->getByTeacher($teacherId);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
respond($rows);
