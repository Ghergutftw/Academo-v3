<?php
require_once __DIR__ . '/../_bootstrap.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

$studentId = $_GET['student_id'] ?? null;

if (!$studentId) {
    respond(['error' => 'student_id is required'], 400);
}

// Get attendance statistics by course for a student
$query = "SELECT 
    c.id as course_id,
    c.name as course_name,
    c.description as course_description,
    COUNT(DISTINCT s.id) as total_sessions,
    COALESCE(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END), 0) as present_count,
    COALESCE(SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END), 0) as absent_count,
    COALESCE(SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END), 0) as late_count,
    COALESCE(SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END), 0) as excused_count,
    CASE 
        WHEN COUNT(DISTINCT s.id) > 0 THEN ROUND((COALESCE(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END), 0) / COUNT(DISTINCT s.id)) * 100, 2)
        ELSE 0
    END as attendance_percentage
FROM students st
JOIN student_groups sg ON st.group_id = sg.id
JOIN group_courses gc ON sg.id = gc.group_id
JOIN courses c ON gc.course_id = c.id
LEFT JOIN sessions s ON c.id = s.course_id AND s.group_id = sg.id
LEFT JOIN attendance a ON s.id = a.session_id AND a.student_id = st.id
WHERE st.id = ?
GROUP BY c.id, c.name, c.description
HAVING COUNT(DISTINCT s.id) > 0
ORDER BY c.name";

$stmt = $db->prepare($query);
$stmt->execute([$studentId]);
$stats = $stmt->fetchAll(PDO::FETCH_ASSOC);

respond($stats);

