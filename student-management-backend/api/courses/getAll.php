<?php
require_once __DIR__ . '/../_bootstrap.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

$course = new Courses($db);
$stmt = $course->getAll();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
respond($rows);
