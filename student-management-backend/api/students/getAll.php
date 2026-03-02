<?php
require_once __DIR__ . '/../_bootstrap.php';
if (!isset($db)) {
    $db = (new Database())->getConnection();
}
$student = new Student($db);
$stmt = $student->getAll();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
respond($rows);