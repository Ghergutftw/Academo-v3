<?php
// Download all files for a laboratory as a zip
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

if (!isset($_GET['lab_id'])) {
    http_response_code(400);
    echo 'Missing lab_id';
    exit;
}

$labId = intval($_GET['lab_id']);

// Obțin year, semester, course_name din DB pe baza lab_id
$db = (new Database())->getConnection();
$sql = "SELECT l.lab_number, c.id as course_id, c.year, c.semester, c.name as course_name FROM laboratories l JOIN courses c ON l.course_id = c.id WHERE l.id = ?";
$stmt = $db->prepare($sql);
$stmt->execute([$labId]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
$labNumber = $row['lab_number'] ?? null;
$year = $row['year'] ?? null;
$semester = $row['semester'] ?? null;
$courseName = $row['course_name'] ?? null;
$courseNameFolder = $courseName ? preg_replace('/\s+/', '_', $courseName) : null;

$baseDir = __DIR__ . '/../../uploads/laboratory_files/';
if ($year && $semester && $courseNameFolder && $labNumber) {
    $dir = $baseDir . "an_{$year}/sem_{$semester}/{$courseNameFolder}/lab_{$labNumber}/";
} else {
    $dir = $baseDir . "lab_{$labId}/";
}
$files = [];
if (is_dir($dir)) {
    foreach (scandir($dir) as $file) {
        if ($file === '.' || $file === '..') continue;
        $files[] = $file;
    }
}

if (empty($files)) {
    http_response_code(404);
    echo 'No files found';
    exit;
}

$zipName = 'lab_' . $labId . '_files_' . time() . '.zip';
$tmpZip = sys_get_temp_dir() . DIRECTORY_SEPARATOR . $zipName;
$zip = new ZipArchive();
if ($zip->open($tmpZip, ZipArchive::CREATE) !== TRUE) {
    http_response_code(500);
    echo 'Could not create zip';
    exit;
}
foreach ($files as $file) {
    $zip->addFile($dir . $file, $file);
}
$zip->close();

header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="' . $zipName . '"');
header('Content-Length: ' . filesize($tmpZip));
readfile($tmpZip);
unlink($tmpZip);
exit;

