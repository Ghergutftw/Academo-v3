<?php
require_once __DIR__ . '/../_bootstrap.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

if (!isset($_POST['course_id'])) {
    respond(['error' => 'Course ID is required'], 400);
}

$courseId = (int)$_POST['course_id'];

// Check if course exists
$courseModel = new Courses($db);
$course = $courseModel->getById($courseId);
if (!$course) {
    respond(['error' => 'Course not found'], 404);
}

// Optional year and semester to structure storage: prefer POST, then course fields, then unknown
if (isset($_POST['year']) && $_POST['year'] !== '') {
    $year = preg_replace('/[^0-9]/', '', $_POST['year']);
} elseif (!empty($course['year'])) {
    $year = preg_replace('/[^0-9]/', '', $course['year']);
} else {
    $year = 'unknown_year';
}

if (isset($_POST['semester']) && $_POST['semester'] !== '') {
    $semester = preg_replace('/[^0-9a-zA-Z_-]/', '', $_POST['semester']);
} elseif (!empty($course['semester'])) {
    $semester = preg_replace('/[^0-9a-zA-Z_-]/', '', $course['semester']);
} else {
    $semester = 'unknown_semester';
}

// --- File upload handling (restore missing block) ---
if (!isset($_FILES['course_file']) || $_FILES['course_file']['error'] !== UPLOAD_ERR_OK) {
    respond(['error' => 'No file uploaded or upload error'], 400);
}

$file = $_FILES['course_file'];
$fileName = $file['name'] ?? '';
$fileTmpName = $file['tmp_name'] ?? '';
$fileSize = $file['size'] ?? 0;
$fileError = $file['error'] ?? UPLOAD_ERR_NO_FILE;

// Keep original filename but sanitize it to avoid path traversal and bad chars
$originalName = basename($fileName);
$originalName = preg_replace('/[^A-Za-z0-9._-]/', '_', $originalName);

// Permite orice extensie de fișier
$fileExtension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

// Validare dimensiune fișier (max 20MB)
$maxFileSize = 20 * 1024 * 1024; // 20MB
if ($fileSize > $maxFileSize) {
    respond(['error' => 'File size too large. Maximum 20MB allowed'], 400);
}
// --- end restored block ---

// Build year/semester folders with prefixes an_ and sem_
$yearFolder = 'an_' . $year;
$semFolder = 'sem_' . $semester;

// Build upload directory with year/semester structure (an_x/sem_y)
$uploadDir = __DIR__ . '/../../uploads/course_files/' . $yearFolder . '/' . $semFolder . '/';

// Creează directorul dacă nu există
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Determine final filename - if file exists, append a counter to keep original name
$targetName = $originalName;
$counter = 0;
while (file_exists($uploadDir . $targetName)) {
    $counter++;
    $nameWithoutExt = pathinfo($originalName, PATHINFO_FILENAME);
    $targetName = $nameWithoutExt . '_' . $counter . '.' . $fileExtension;
}

$uploadPath = $uploadDir . $targetName;

// Remove old file if exists (old stored course_file may be a path)
if (!empty($course['course_file'])) {
    $oldFilePath = __DIR__ . '/../../uploads/course_files/' . $course['course_file'];
    if (file_exists($oldFilePath)) {
        unlink($oldFilePath);
    }
}

// Move uploaded file
if (move_uploaded_file($fileTmpName, $uploadPath)) {
    // Store relative path in DB: an_{year}/sem_{semester}/filename
    $relativePath = $yearFolder . '/' . $semFolder . '/' . $targetName;

    // Use model method to update DB
    if ($courseModel->setCourseFile($courseId, $relativePath)) {
        respond([
            'success' => true,
            'filename' => $targetName,
            'original_name' => $fileName,
            'size' => $fileSize
        ]);
    } else {
        // Șterge fișierul uploadat dacă update-ul în DB a eșuat
        unlink($uploadPath);
        respond(['error' => 'Failed to update database'], 500);
    }
} else {
    respond(['error' => 'Failed to upload file'], 500);
}
