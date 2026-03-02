<?php
require_once __DIR__ . '/../_bootstrap.php';
require_once __DIR__ . '/../../models/User.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_input();
$email = $input['email'] ?? '';
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    respond(['error' => 'Email and password are required'], 400);
}

$user = new User($db);
$loginResult = $user->login($email, $password);

if ($loginResult) {
    $userName = $loginResult['name'];
    if (empty($userName)) {
        $userDetails = $user->getUserDetails($loginResult['role'], $loginResult['user_type_id']);
        $userName = $userDetails['name'] ?? 'User';
    }

    $response = [
        'success' => true,
        'user' => [
            'id' => $loginResult['id'],
            'email' => $loginResult['email'],
            'role' => $loginResult['role'],
            'user_type_id' => $loginResult['user_type_id'],
            'name' => $userName,
        ],
        'token' => base64_encode(json_encode([
            'id' => $loginResult['id'],
            'email' => $loginResult['email'],
            'role' => $loginResult['role'],
            'user_type_id' => $loginResult['user_type_id']
        ]))
    ];
    respond($response, 200);
} else {
    respond(['error' => 'Invalid email or password'], 401);
}

