<?php
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['id'], $input['name'], $input['year'], $input['academic_year'])) {
    respond(['error' => 'Missing required fields: id, name, year, academic_year'], 400);
}

$group = new StudentGroups($db);
$success = $group->update($input['id'], $input['name'], $input['year'], $input['academic_year']);

if ($success) {
    // If student_ids are provided, update group_id for students
    if (isset($input['student_ids']) && is_array($input['student_ids'])) {
        // First, remove this group from all students
        $stmt = $db->prepare('UPDATE students SET group_id = NULL WHERE group_id = ?');
        $stmt->execute([$input['id']]);
        
        // Then assign the selected students to this group
        if (count($input['student_ids']) > 0) {
            $stmt = $db->prepare('UPDATE students SET group_id = ? WHERE id = ?');
            foreach ($input['student_ids'] as $studentId) {
                $stmt->execute([$input['id'], $studentId]);
            }
        }
    }
    
    respond(['success' => true]);
} else {
    respond(['error' => 'Update failed'], 500);
}

