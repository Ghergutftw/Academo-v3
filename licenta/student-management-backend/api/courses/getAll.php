<?php
require_once __DIR__ . '/../_bootstrap.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

// Get optional filters
$year = isset($_GET['year']) ? intval($_GET['year']) : null;
$semester = isset($_GET['semester']) ? intval($_GET['semester']) : null;

$course = new Courses($db);
$stmt = $course->getAll($year, $semester);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Convert stored relative path to filename only
foreach ($rows as &$row) {
    if (!empty($row['course_file'])) {
        $row['course_file'] = basename($row['course_file']);
    }
}

respond($rows);
