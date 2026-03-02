<?php
require_once __DIR__ . '/../enums/UserRole.php';
require_once __DIR__ . '/../models/Teacher.php';
require_once __DIR__ . '/../models/Student.php';

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
        if (!$decoded || !isset($decoded['id'], $decoded['role'])) {
            return null;
        }
        
        // Verify user still exists based on role
        if ($decoded['role'] === UserRole::ADMIN || $decoded['role'] === UserRole::TEACHER) {
            $teacherModel = new Teacher($db);
            $teacher = $teacherModel->getById($decoded['id']);
            if ($teacher) {
                return [
                    'id' => $teacher['id'],
                    'email' => $teacher['email'],
                    'role' => $teacher['is_admin'] ? UserRole::ADMIN : UserRole::TEACHER,
                    'user_type_id' => $teacher['id'],
                    'name' => $teacher['name'],
                    'is_admin' => (bool)$teacher['is_admin']
                ];
            }
        } else if ($decoded['role'] === UserRole::STUDENT) {
            $studentModel = new Student($db);
            $student = $studentModel->getById($decoded['id']);
            if ($student) {
                return [
                    'id' => $student['id'],
                    'email' => $student['email'],
                    'role' => UserRole::STUDENT,
                    'user_type_id' => $student['id'],
                    'name' => $student['name']
                ];
            }
        }
    } catch (Exception $e) {
        error_log('Auth error: ' . $e->getMessage());
    }
    
    return null;
}

function requireAuth($allowedRoles = []) {
    global $db;
    $user = getAuthUser($db);
    
    if (!$user) {
        respond(['error' => 'Unauthorized. Authentication required.'], 401);
        exit;
    }
    
    // Check roles if specified
    if (!empty($allowedRoles) && !in_array($user['role'], $allowedRoles)) {
        respond(['error' => 'Forbidden. Insufficient permissions.'], 403);
        exit;
    }
    
    return $user;
}

function requireRole($allowedRoles) {
    return requireAuth($allowedRoles);
}


