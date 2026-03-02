<?php
require_once __DIR__ . '/../_bootstrap.php';
require_once __DIR__ . '/../../models/User.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

$token = null;
$headers = getallheaders();
if (isset($headers['Authorization'])) {
    $token = str_replace('Bearer ', '', $headers['Authorization']);
} else if (isset($_GET['token'])) {
    $token = $_GET['token'];
}

if (!$token) {
    respond(['error' => 'Token required'], 401);
}

try {
    $decoded = json_decode(base64_decode($token), true);
    if (!$decoded || !isset($decoded['id'])) {
        throw new Exception('Invalid token');
    }
    
    $user = new User($db);
    $userData = $user->getById($decoded['id']);
    
    if ($userData) {
        $userName = $userData['name'];
        if (empty($userName)) {
            $userDetails = $user->getUserDetails($userData['role'], $userData['user_type_id']);
            $userName = $userDetails['name'] ?? 'User';
        }

        respond([
            'valid' => true,
            'user' => [
                'id' => $userData['id'],
                'email' => $userData['email'],
                'role' => $userData['role'],
                'user_type_id' => $userData['user_type_id'],
                'name' => $userName,
            ]
        ], 200);
    } else {
        respond(['error' => 'User not found'], 404);
    }
} catch (Exception $e) {
    respond(['error' => 'Invalid token'], 401);
}

