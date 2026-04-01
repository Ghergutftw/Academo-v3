<?php
require_once __DIR__ . '/../_bootstrap.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

$user = requireAuth();

respond([
    'valid' => true,
    'user' => $user
], 200);

