<?php
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['students']) || !is_array($input['students'])) {
    respond(['error' => 'Missing required field: students array'], 400);
}

// Check if we should update duplicates or skip them
$updateDuplicates = isset($input['updateDuplicates']) ? (bool)$input['updateDuplicates'] : false;

$student = new Student($db);
$results = [
    'success' => 0,
    'failed' => 0,
    'updated' => 0,
    'skipped' => 0,
    'errors' => []
];

foreach ($input['students'] as $index => $studentData) {
    // Validate each student data
    if (!isset($studentData['name']) || !isset($studentData['email']) || (!isset($studentData['group_id']) && !isset($studentData['group_name']))) {
        $results['failed']++;
        $results['errors'][] = [
            'row' => $index + 1,
            'error' => 'Missing required fields (name, email, or group_id/group_name)',
            'data' => $studentData
        ];
        continue;
    }

    // Clean up the data
    $name = trim($studentData['name']);
    $email = trim($studentData['email']);
    $password = isset($studentData['password']) ? trim($studentData['password']) : 'student123'; // Default password
    $group_id = isset($studentData['group_id']) ? intval($studentData['group_id']) : null;
    $group_name = isset($studentData['group_name']) ? trim($studentData['group_name']) : null;
    $start_year = isset($studentData['start_year']) ? intval($studentData['start_year']) : null;
    $study_cycle = isset($studentData['study_cycle']) ? trim($studentData['study_cycle']) : 'Licenta';
    $study_year = isset($studentData['study_year']) ? intval($studentData['study_year']) : 1;
    $financing_type = isset($studentData['financing_type']) ? trim($studentData['financing_type']) : 'Buget';
    $student_status = isset($studentData['student_status']) ? trim($studentData['student_status']) : 'Activ';

    // Validate data
    if (empty($name)) {
        $results['failed']++;
        $results['errors'][] = [
            'row' => $index + 1,
            'error' => 'Name cannot be empty',
            'data' => $studentData
        ];
        continue;
    }

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $results['failed']++;
        $results['errors'][] = [
            'row' => $index + 1,
            'error' => 'Invalid email address',
            'data' => $studentData
        ];
        continue;
    }

    // If group_name is provided but no group_id, create the group
    if (!$group_id && $group_name) {
        $groupModel = new StudentGroups($db);
        
        // Check if group exists by name
        $stmt = $db->prepare('SELECT id FROM student_groups WHERE name = ? LIMIT 1');
        $stmt->execute([$group_name]);
        $existingGroup = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existingGroup) {
            $group_id = $existingGroup['id'];
        } else {
            // Create new group with default academic year
            $currentYear = date('Y');
            $nextYear = $currentYear + 1;
            $academic_year = "$currentYear-$nextYear";
            
            $group_id = $groupModel->create($group_name, $study_year, $academic_year);
            
            if (!$group_id) {
                $results['failed']++;
                $results['errors'][] = [
                    'row' => $index + 1,
                    'error' => "Failed to create group '$group_name'",
                    'data' => $studentData
                ];
                continue;
            }
        }
    }

    if (!$group_id || $group_id <= 0) {
        $results['failed']++;
        $results['errors'][] = [
            'row' => $index + 1,
            'error' => 'Invalid group_id',
            'data' => $studentData
        ];
        continue;
    }

    // Attempt to create student
    try {
        // Check if student with this email already exists
        $existingStudent = $student->getByEmail($email);

        if ($existingStudent) {
            if ($updateDuplicates) {
                // Update existing student (password only if provided and not default)
                $updatePassword = ($password !== 'student123') ? $password : null;
                $updated = $student->update($existingStudent['id'], $name, $email, $group_id, $updatePassword, $start_year, $study_cycle, $study_year, $financing_type, $student_status);
                if ($updated) {
                    $results['updated']++;
                } else {
                    $results['failed']++;
                    $results['errors'][] = [
                        'row' => $index + 1,
                        'error' => 'Failed to update existing student',
                        'data' => $studentData
                    ];
                }
            } else {
                // Skip duplicate
                $results['skipped']++;
                $results['errors'][] = [
                    'row' => $index + 1,
                    'error' => 'Student with this email already exists (skipped)',
                    'data' => $studentData
                ];
            }
        } else {
            // Create new student with password
            $newId = $student->create($name, $email, $password, $group_id, $start_year, $study_cycle, $study_year, $financing_type, $student_status);

            if ($newId) {
                $results['success']++;
            } else {
                $results['failed']++;
                $results['errors'][] = [
                    'row' => $index + 1,
                    'error' => 'Failed to create student',
                    'data' => $studentData
                ];
            }
        }
    } catch (Exception $e) {
        $results['failed']++;
        $results['errors'][] = [
            'row' => $index + 1,
            'error' => 'Database error: ' . $e->getMessage(),
            'data' => $studentData
        ];
    }
}

respond($results, 200);

