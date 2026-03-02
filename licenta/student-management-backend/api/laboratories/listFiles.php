<?php
// List all files for a laboratory
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

if (!isset($_GET['lab_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing lab_id']);
    exit;
}

$labId = intval($_GET['lab_id']);

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
    $dir = $baseDir . "an_{$year}/sem_{$semester}/{$courseNameFolder}/lab_{$labNumber}/";
} else {
    $dir = $baseDir . "lab_{$labId}/";
}
$files = [];
if (is_dir($dir)) {
    foreach (scandir($dir) as $file) {
        if ($file === '.' || $file === '..') continue;
        $files[] = [
            'name' => $file,
            'path' => str_replace($baseDir, '', $dir) . $file
        ];
    }
}
echo json_encode($files);

