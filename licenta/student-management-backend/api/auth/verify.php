<?php
require_once __DIR__ . '/../_bootstrap.php';

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
    if (!$decoded || !isset($decoded['id'], $decoded['role'])) {
        throw new Exception('Invalid token');
    }
    
    // Verify user based on role
    $userData = null;
    if ($decoded['role'] === UserRole::ADMIN || $decoded['role'] === UserRole::TEACHER) {
        $teacherModel = new Teacher($db);
        $teacher = $teacherModel->getById($decoded['id']);
        if ($teacher) {
            $userData = [
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
            $userData = [
                'id' => $student['id'],
                'email' => $student['email'],
                'role' => UserRole::STUDENT,
                'user_type_id' => $student['id'],
                'name' => $student['name'],
                'study_cycle' => $student['study_cycle'] ?? 'Licenta'
            ];
        }
    }
    
    if ($userData) {
        respond([
            'valid' => true,
            'user' => $userData
        ], 200);
    } else {
        respond(['error' => 'User not found'], 404);
    }
} catch (Exception $e) {
    respond(['error' => 'Invalid token: ' . $e->getMessage()], 401);
}

