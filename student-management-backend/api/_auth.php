<?php
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../enums/UserRole.php';

function getAuthUser($db) {
    $token = null;

    $headers = getallheaders();
    if ($headers && isset($headers['Authorization'])) {
        $token = str_replace('Bearer ', '', $headers['Authorization']);
    } else if ($headers && isset($headers['authorization'])) {
        $token = str_replace('Bearer ', '', $headers['authorization']);
    }

    if (!$token && isset($_GET['token'])) {
        $token = $_GET['token'];
    } else if (!$token && isset($_POST['token'])) {
        $token = $_POST['token'];
    }
    
    if (!$token) {
        return null;
    }
    
    try {
        $decoded = json_decode(base64_decode($token), true);
        if (!$decoded || !isset($decoded['id'])) {
            return null;
        }
        
        $user = new User($db);
        $userData = $user->getById($decoded['id']);
        
        if ($userData) {
            return [
                'id' => $userData['id'],
                'email' => $userData['email'],
                'role' => $userData['role'],
                'user_type_id' => $userData['user_type_id']
            ];
        }
    } catch (Exception $e) {
        error_log('Auth error: ' . $e->getMessage());
    }
    
    return null;
}

function requireAuth($db) {
    $user = getAuthUser($db);
    
    if (!$user) {
        respond(['error' => 'Unauthorized. Authentication required.'], 401);
        exit;
    }
    
    return $user;
}

function requireRole($db, $allowedRoles) {
    $user = requireAuth($db);

    if (!in_array($user['role'], $allowedRoles)) {
        respond(['error' => 'Forbidden. Insufficient permissions.'], 403);
        exit;
    }

    return $user;
}


