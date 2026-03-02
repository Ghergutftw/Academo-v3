<?php
// Upload file for a laboratory
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

if (!isset($_POST['lab_id']) || !isset($_FILES['lab_file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing parameters']);
    exit;
}

$labId = intval($_POST['lab_id']);
$file = $_FILES['lab_file'];

// Obțin year, semester, course_id din DB pe baza lab_id
$db = (new Database())->getConnection();
$sql = "SELECT l.lab_number, c.id as course_id, c.year, c.semester, c.name as course_name FROM laboratories l JOIN courses c ON l.course_id = c.id WHERE l.id = ?";
$stmt = $db->prepare($sql);
$stmt->execute([$labId]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
$labNumber = $row['lab_number'] ?? null;
$courseId = $row['course_id'] ?? null;
$year = $row['year'] ?? null;
$semester = $row['semester'] ?? null;
$courseName = $row['course_name'] ?? null;
$courseNameFolder = $courseName ? preg_replace('/\s+/', '_', $courseName) : null;

$baseDir = __DIR__ . '/../../uploads/laboratory_files/';
if ($year && $semester && $courseNameFolder && $labNumber) {
    $uploadDir = $baseDir . "an_{$year}/sem_{$semester}/{$courseNameFolder}/lab_{$labNumber}/";
} else {
    $uploadDir = $baseDir . "lab_{$labId}/";
}
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$baseName = pathinfo($file['name'], PATHINFO_FILENAME);
$date = date('Ymd_His');
$filename = $baseName . '_' . $date . '.' . $ext;
$targetPath = $uploadDir . $filename;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    echo json_encode(['filename' => $filename]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to upload file']);
}
