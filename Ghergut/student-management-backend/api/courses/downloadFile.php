<?php
require_once __DIR__ . '/../_bootstrap.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'HEAD') {
    respond(['error' => 'Method not allowed'], 405);
}

if (!isset($_GET['course_id'])) {
    respond(['error' => 'Course ID is required'], 400);
}

$courseId = (int)$_GET['course_id'];

// Check if course exists and has a file
$courseModel = new Courses($db);
$course = $courseModel->getById($courseId);
if (!$course) {
    respond(['error' => 'Course not found'], 404);
}

if (empty($course['course_file'])) {
    respond(['error' => 'No file associated with this course'], 404);
}

$fileName = $course['course_file'];
$filePath = __DIR__ . '/../../uploads/course_files/' . $fileName;

if (!file_exists($filePath)) {
    respond(['error' => 'File not found on server'], 404);
}

// Use the uploaded filename (basename of stored relative path) as download name
$downloadName = basename($fileName);
$downloadName = preg_replace('/[^A-Za-z0-9\-_.]/', '_', $downloadName); // sanitize

// Determine MIME type by extension
$ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
$mimeTypes = [
    'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls' => 'application/vnd.ms-excel',
    'pdf' => 'application/pdf',
    'doc' => 'application/msword',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'ppt' => 'application/vnd.ms-powerpoint',
    'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'zip' => 'application/zip',
    'csv' => 'text/csv'
];
$contentType = $mimeTypes[$ext] ?? 'application/octet-stream';

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
    // Set headers for download
    header('Content-Type: ' . $contentType);
    header('Content-Disposition: attachment; filename="' . $downloadName . '"');
    header('Content-Length: ' . filesize($filePath));
    header('Cache-Control: no-cache, must-revalidate');
    header('Pragma: public');
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
