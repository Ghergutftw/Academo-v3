<?php
require_once __DIR__ . '/../_bootstrap.php';

$body = json_input();
$teacherId = $body['teacher_id'] ?? null;
$groupId   = $body['group_id'] ?? null;
$subject   = $body['subject'] ?? null; // keep string subject to match your existing LabSession model

if (!$teacherId || !$groupId || !$subject) {
    respond(['error' => 'teacher_id, group_id and subject are required'], 400);
}

// Create lab session
$sql = "INSERT INTO lab_sessions (teacher_id, group_id, subject, date) VALUES (?, ?, ?, NOW())";
$stmt = $db->prepare($sql);
$stmt->execute([$teacherId, $groupId, $subject]);
$sessionId = (int)$db->lastInsertId();

// Return session + roster for UI checkboxes
$rosterStmt = $db->prepare("SELECT id, name, email FROM students WHERE group_id = ? ORDER BY name");
$rosterStmt->execute([$groupId]);

respond([
    'session_id' => $sessionId,
    'group_id' => (int)$groupId,
    'subject' => $subject,
    'students' => $rosterStmt->fetchAll(),
]);