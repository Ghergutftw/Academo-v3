<?php
require_once __DIR__ . '/../_bootstrap.php';
if (!isset($db)) {
    $db = (new Database())->getConnection();
}

$year = $_GET['year'] ?? null;

$student = new Student($db);
$stmt = $student->getAll($year);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
//transformă rezultatul brut din baza de date într-un
// array asociativ PHP (cheile array-ului vor fi numele
// coloanelor din tabel).
respond($rows);