<?php
require_once __DIR__ . '/../_bootstrap.php';
$teacher = new Teacher($db);
$stmt = $teacher->getAll();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
respond($rows);
