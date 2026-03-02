<?php
require_once __DIR__ . '/../_bootstrap.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

$studentId = $_GET['student_id'] ?? null;

if (!$studentId) {
    respond(['error' => 'student_id is required'], 400);
}

try {
    $query = "SELECT 
                c.id as course_id,
                c.name as course_name,
                COUNT(a.id) as total_sessions,
                SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
                SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
                ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 2) as attendance_percentage
              FROM attendance a
              JOIN sessions s ON a.session_id = s.id
              JOIN courses c ON s.course_id = c.id
              WHERE a.student_id = ?
              GROUP BY c.id, c.name
              ORDER BY c.name";
    
    $stmt = $db->prepare($query);
    $stmt->execute([$studentId]);
    $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    respond($stats);
} catch (Exception $e) {
    respond(['error' => 'Failed to get attendance statistics: ' . $e->getMessage()], 500);
}

