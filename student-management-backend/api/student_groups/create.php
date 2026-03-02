<?php
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['name'], $input['year'], $input['academic_year'])) {
    respond(['error' => 'Missing required fields: name, year, academic_year'], 400);
}

$group = new StudentGroups($db);
$newId = $group->create($input['name'], $input['year'], $input['academic_year']);

if ($newId) {
    // If student_ids are provided, update group_id for those students
    if (isset($input['student_ids']) && is_array($input['student_ids']) && count($input['student_ids']) > 0) {
        $stmt = $db->prepare('UPDATE students SET group_id = ? WHERE id = ?');
        foreach ($input['student_ids'] as $studentId) {
            $stmt->execute([$newId, $studentId]);
        }
    }
    
    $createdGroup = $group->getById($newId);
    respond($createdGroup, 201);
} else {
    respond(['error' => 'Failed to create group'], 500);
}

