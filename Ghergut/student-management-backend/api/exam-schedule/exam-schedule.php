<?php
require_once __DIR__ . '/../_bootstrap.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

// Handle GET request
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Check if user is authenticated (any authenticated user can download)
    $currentUser = getAuthUser($db);

    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized - please log in']);
        exit;
    }

    // Check if this is an info request
    if (isset($_GET['info']) && $_GET['info'] === '1') {
        // Return schedule info without downloading
        $currentYear = date('Y');
        $scheduleModel = new ExamSchedule($db);
        $schedule = $scheduleModel->getByYear($currentYear);

        if ($schedule) {
            http_response_code(200);
            echo json_encode([
                'exists' => true,
                'schedule' => $schedule
            ]);
        } else {
            http_response_code(200);
            echo json_encode([
                'exists' => false
            ]);
        }
        exit;
    }

    // Otherwise, download the file
    $currentYear = date('Y');
    $scheduleModel = new ExamSchedule($db);
    $schedule = $scheduleModel->getByYear($currentYear);

    if (!$schedule) {
        echo json_encode(['error' => 'Schedule file not found']);
        exit;
    }

    $filePath = __DIR__ . '/../../' . ltrim($schedule['file_path'], '/');

    if (file_exists($filePath)) {
        // Verify file is readable and get actual size
        if (!is_readable($filePath)) {
            http_response_code(500);
            echo json_encode(['error' => 'File is not readable']);
            exit;
        }

        $fileSize = filesize($filePath);

        // Disable output buffering completely and clear any existing buffers
        while (ob_get_level()) {
            ob_end_clean();
        }

        // Turn off output buffering completely
        if (ini_get('output_buffering')) {
            ini_set('output_buffering', 'off');
        }
        if (ini_get('zlib.output_compression')) {
            ini_set('zlib.output_compression', 'off');
        }

        // Ensure no whitespace or output before headers
        if (!headers_sent()) {
            // Set proper headers for download
            header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            header('Content-Disposition: attachment; filename="' . basename($filePath) . '"');
            header('Content-Length: ' . $fileSize);
            header('Cache-Control: no-cache, no-store, must-revalidate');
            header('Pragma: no-cache');
            header('Expires: 0');
        }

        // Clean the output buffer and send the file
        if (ob_get_level()) {
            ob_clean();
        }

        // Use fpassthru for better memory handling with large files
        $handle = fopen($filePath, 'rb');
        if ($handle) {
            fpassthru($handle);
            fclose($handle);
        } else {
            readfile($filePath);
        }
        exit;
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Schedule file not found on disk']);
        exit;
    }
}

// Handle POST request - upload the schedule file
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // Check if user is authenticated and is admin using token-based auth
    $currentUser = getAuthUser($db);

    if (!$currentUser) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized - not logged in']);
        exit;
    }

    // Check if user is admin
    $isAdmin = isset($currentUser['is_admin']) && $currentUser['is_admin'] === true;

    if (!$isAdmin) {
        http_response_code(403);
        echo json_encode(['error' => 'Unauthorized - admin access required']);
        exit;
    }

    if (!isset($_FILES['file'])) {
        http_response_code(400);
        echo json_encode(['error' => 'No file provided']);
        exit;
    }

    $currentYear = date('Y');
    $uploadDir = __DIR__ . '/../../uploads/exam-schedules/' . $currentYear . '/';

    // Create directory if it doesn't exist
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create upload directory']);
            exit;
        }
    }

    $file = $_FILES['file'];
    $fileName = 'Programare_Examene.xlsx';
    $filePath = $uploadDir . $fileName;

    // Validate file type
    $allowedMimes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/x-msexcel',
        'application/x-ms-excel',
        'application/x-excel'
    ];

    $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    // Check file extension
    if (!in_array($fileExtension, ['xlsx', 'xls'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file extension. Only .xlsx and .xls files are allowed.']);
        exit;
    }

    // Check MIME type (more flexible)
    if (!in_array($file['type'], $allowedMimes) && strpos($file['type'], 'spreadsheet') === false) {
        // Only warn, don't block - some systems have different MIME types
        // You can log this if needed
    }

    // Validate file size (max 10MB)
    if ($file['size'] > 10 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['error' => 'File too large. Maximum size is 10MB.']);
        exit;
    }

    // Move uploaded file
    if (move_uploaded_file($file['tmp_name'], $filePath)) {
        // Save to database
        try {
            $scheduleModel = new ExamSchedule($db);
            $relativePath = 'uploads/exam-schedules/' . $currentYear . '/' . $fileName;
            $scheduleModel->save($fileName, $relativePath, $currentUser['id'], $currentYear);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Schedule file uploaded successfully',
                'filename' => $fileName,
                'year' => $currentYear,
                'path' => '/' . $relativePath
            ]);
        } catch (Exception $e) {
            // File was uploaded but database save failed
            http_response_code(500);
            echo json_encode([
                'error' => 'File uploaded but database save failed: ' . $e->getMessage()
            ]);
        }
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to upload file']);
    }
    exit;
}

// Handle other methods
http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
exit;
?>

