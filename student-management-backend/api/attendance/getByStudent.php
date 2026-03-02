<?php
require_once __DIR__ . '/../_bootstrap.php';
$studentId = $_GET['student_id'] ?? null;
if (!$studentId) respond(['error' => 'student_id is required'], 400);

$sql = "SELECT a.id, a.status, a.recorded_at,
               s.id AS session_id, s.session_date, s.topic,
               c.id AS course_id, c.name AS course_name,
               t.name AS teacher_name
        FROM attendance a
        JOIN sessions s ON s.id = a.session_id
        JOIN courses c ON c.id = s.course_id
        LEFT JOIN teachers t ON t.id = c.teacher_id
        WHERE a.student_id = ?
        ORDER BY s.session_date DESC";
$stmt = $db->prepare($sql);
$stmt->execute([$studentId]);
respond($stmt->fetchAll(PDO::FETCH_ASSOC));
