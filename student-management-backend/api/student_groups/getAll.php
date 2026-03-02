<?php
require_once __DIR__ . '/../_bootstrap.php';
$group = new Group($db);
$stmt = $group->getAll();
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
respond($rows);