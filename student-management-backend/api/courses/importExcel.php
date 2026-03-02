<?php
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['courses']) || !is_array($input['courses'])) {
    respond(['error' => 'Missing required field: courses array'], 400);
}

// Check if we should update duplicates or skip them
$updateDuplicates = isset($input['updateDuplicates']) ? (bool)$input['updateDuplicates'] : false;

$course = new Courses($db);
$results = [
    'success' => 0,
    'failed' => 0,
    'updated' => 0,
    'skipped' => 0,
    'errors' => []
];

foreach ($input['courses'] as $index => $courseData) {
    // Validate each course data - only name is required
    if (!isset($courseData['name'])) {
        $results['failed']++;
        $results['errors'][] = [
            'row' => $index + 1,
            'error' => 'Missing required field (name)',
            'data' => $courseData
        ];
        continue;
    }

    // Clean up the data
    $name = trim($courseData['name']);
    $description = isset($courseData['description']) ? trim($courseData['description']) : '';
    // Teacher ID is completely optional - can be NULL
    $teacher_id = isset($courseData['teacher_id']) && $courseData['teacher_id'] ? intval($courseData['teacher_id']) : null;

    // Validate data
    if (empty($name)) {
        $results['failed']++;
        $results['errors'][] = [
            'row' => $index + 1,
            'error' => 'Name cannot be empty',
            'data' => $courseData
        ];
        continue;
    }

    // Attempt to create course
    try {
        // Check if course with this name already exists
        $existingCourse = $course->getByName($name);

        if ($existingCourse) {
            if ($updateDuplicates) {
                // Update existing course
                $updated = $course->update($existingCourse['id'], $name, $description, $teacher_id);
                if ($updated) {
                    $results['updated']++;
                } else {
                    $results['failed']++;
                    $results['errors'][] = [
                        'row' => $index + 1,
                        'error' => 'Failed to update existing course',
                        'data' => $courseData
                    ];
                }
            } else {
                // Skip duplicate
                $results['skipped']++;
                $results['errors'][] = [
                    'row' => $index + 1,
                    'error' => 'Course with this name already exists (skipped)',
                    'data' => $courseData
                ];
            }
        } else {
            // Create new course
            $newId = $course->create($name, $description, $teacher_id);

            if ($newId) {
                $results['success']++;
            } else {
                $results['failed']++;
                $results['errors'][] = [
                    'row' => $index + 1,
                    'error' => 'Failed to create course',
                    'data' => $courseData
                ];
            }
        }
    } catch (Exception $e) {
        $results['failed']++;
        $results['errors'][] = [
            'row' => $index + 1,
            'error' => 'Database error: ' . $e->getMessage(),
            'data' => $courseData
        ];
    }
}

respond($results, 200);

