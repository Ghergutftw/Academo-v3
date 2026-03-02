<?php
require_once __DIR__ . '/../_bootstrap.php';

// Handle GET request
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Check if user is authenticated (any authenticated user can download)
    $currentUser = getAuthUser($db);

    if (!$currentUser) {
        respond(['error' => 'Unauthorized - please log in'], 401);
    }

    // Check if this is an info request
    if (isset($_GET['info']) && $_GET['info'] === '1') {
        // Return schedule info without downloading
        $currentYear = date('Y');
        $scheduleModel = new ExamSchedule($db);
        $schedule = $scheduleModel->getByYear($currentYear);

        if ($schedule) {
            respond([
                'exists' => true,
                'schedule' => $schedule
            ], 200);
        } else {
            respond([
                'exists' => false
            ], 200);
        }
    }

    // Otherwise, download the file
    $currentYear = date('Y');
    $scheduleModel = new ExamSchedule($db);
    $schedule = $scheduleModel->getByYear($currentYear);

    if (!$schedule) {
        respond(['error' => 'Schedule file not found'], 404);
    }

    $filePath = __DIR__ . '/../../' . ltrim($schedule['file_path'], '/');

    if (file_exists($filePath)) {
        // Set proper headers for download
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . basename($filePath) . '"');
        header('Content-Length: ' . filesize($filePath));
        readfile($filePath);
        exit;
    } else {
        respond(['error' => 'Schedule file not found on disk'], 404);
    }
}

// Handle POST request - upload the schedule file
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if user is authenticated and is admin using token-based auth
    $currentUser = getAuthUser($db);

    if (!$currentUser) {
        respond(['error' => 'Unauthorized - not logged in'], 401);
    }

    // Check if user is admin
    $isAdmin = isset($currentUser['is_admin']) && $currentUser['is_admin'] === true;

    if (!$isAdmin) {
        respond(['error' => 'Unauthorized - admin access required'], 403);
    }

    if (!isset($_FILES['file'])) {
        respond(['error' => 'No file provided'], 400);
    }

    $currentYear = date('Y');
    $uploadDir = __DIR__ . '/../../uploads/exam-schedules/' . $currentYear . '/';

    // Create directory if it doesn't exist
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            respond(['error' => 'Failed to create upload directory'], 500);
        }
    }

    $file = $_FILES['file'];
    $fileName = 'Programare_Examene.xlsx';
    $filePath = $uploadDir . $fileName;

    // Validate file type
    $allowedMimes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
    ];

    if (!in_array($file['type'], $allowedMimes)) {
        respond(['error' => 'Invalid file type. Only Excel files are allowed.'], 400);
    }

    // Validate file size (max 10MB)
    if ($file['size'] > 10 * 1024 * 1024) {
        respond(['error' => 'File too large. Maximum size is 10MB.'], 400);
    }

    // Move uploaded file
    if (move_uploaded_file($file['tmp_name'], $filePath)) {
        // Save to database
        try {
            $scheduleModel = new ExamSchedule($db);
            $relativePath = 'uploads/exam-schedules/' . $currentYear . '/' . $fileName;
            $scheduleModel->save($fileName, $relativePath, $currentUser['id'], $currentYear);

            respond([
                'success' => true,
                'message' => 'Schedule file uploaded successfully',
                'filename' => $fileName,
                'year' => $currentYear,
                'path' => '/' . $relativePath
            ], 200);
        } catch (Exception $e) {
            // File was uploaded but database save failed
            respond([
                'error' => 'File uploaded but database save failed: ' . $e->getMessage()
            ], 500);
        }
    } else {
        respond(['error' => 'Failed to upload file'], 500);
    }
}

// Handle other methods
respond(['error' => 'Method not allowed'], 405);
?>

