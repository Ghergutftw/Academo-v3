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
    if (!isset($studentData['name']) || !isset($studentData['email']) || !isset($studentData['group_id'])) {
        $results['failed']++;
        $results['errors'][] = [
            'row' => $index + 1,
            'error' => 'Missing required fields (name, email, or group_id)',
            'data' => $studentData
        ];
        continue;
    }

    // Clean up the data
    $name = trim($studentData['name']);
    $email = trim($studentData['email']);
    $group_id = intval($studentData['group_id']);

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

    if ($group_id <= 0) {
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
                // Update existing student
                $updated = $student->update($existingStudent['id'], $name, $email, $group_id);
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
            // Create new student
            $newId = $student->create($name, $email, $group_id);

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

