<?php
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['teachers']) || !is_array($input['teachers'])) {
    respond(['error' => 'Missing required field: teachers array'], 400);
}

// Check if we should update duplicates or skip them
$updateDuplicates = isset($input['updateDuplicates']) ? (bool)$input['updateDuplicates'] : false;

$teacher = new Teacher($db);
$results = [
    'success' => 0,
    'failed' => 0,
    'updated' => 0,
    'skipped' => 0,
    'errors' => []
];

foreach ($input['teachers'] as $index => $teacherData) {
    // Validate each teacher data
    if (!isset($teacherData['name']) || !isset($teacherData['email'])) {
        $results['failed']++;
        $results['errors'][] = [
            'row' => $index + 1,
            'error' => 'Missing required fields (name or email)',
            'data' => $teacherData
        ];
        continue;
    }

    // Clean up the data
    $name = trim($teacherData['name']);
    $email = trim($teacherData['email']);

    // Validate data
    if (empty($name)) {
        $results['failed']++;
        $results['errors'][] = [
            'row' => $index + 1,
            'error' => 'Name cannot be empty',
            'data' => $teacherData
        ];
        continue;
    }

    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $results['failed']++;
        $results['errors'][] = [
            'row' => $index + 1,
            'error' => 'Invalid email address',
            'data' => $teacherData
        ];
        continue;
    }

    // Attempt to create teacher
    try {
        // Check if teacher with this email already exists
        $existingTeacher = $teacher->getByEmail($email);

        if ($existingTeacher) {
            if ($updateDuplicates) {
                // Update existing teacher
                $updated = $teacher->update($existingTeacher['id'], $name, $email);
                if ($updated) {
                    $results['updated']++;
                } else {
                    $results['failed']++;
                    $results['errors'][] = [
                        'row' => $index + 1,
                        'error' => 'Failed to update existing teacher',
                        'data' => $teacherData
                    ];
                }
            } else {
                // Skip duplicate
                $results['skipped']++;
                $results['errors'][] = [
                    'row' => $index + 1,
                    'error' => 'Teacher with this email already exists (skipped)',
                    'data' => $teacherData
                ];
            }
        } else {
            // Create new teacher
            $newId = $teacher->create($name, $email);

            if ($newId) {
                $results['success']++;
            } else {
                $results['failed']++;
                $results['errors'][] = [
                    'row' => $index + 1,
                    'error' => 'Failed to create teacher',
                    'data' => $teacherData
                ];
            }
        }
    } catch (Exception $e) {
        $results['failed']++;
        $results['errors'][] = [
            'row' => $index + 1,
            'error' => 'Database error: ' . $e->getMessage(),
            'data' => $teacherData
        ];
    }
}

respond($results, 200);

