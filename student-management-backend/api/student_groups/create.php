<?php
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['name'], $input['year'])) {
    respond(['error' => 'Missing required fields: name, year'], 400);
}

$group = new Group($db);
$newId = $group->create($input['name'], $input['year']);

if ($newId) {
    $createdGroup = $group->getById($newId);
    respond($createdGroup, 201);
} else {
    respond(['error' => 'Failed to create group'], 500);
}

