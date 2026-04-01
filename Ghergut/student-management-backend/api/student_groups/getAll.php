<?php
require_once __DIR__ . '/../_bootstrap.php';
$group = new StudentGroups($db);
$stmt = $group->getAll();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
respond($rows);