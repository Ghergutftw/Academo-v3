<?php
require_once __DIR__ . '/../_bootstrap.php';
require_once __DIR__ . '/../../models/Student.php';
require_once __DIR__ . '/../../models/Teacher.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

$input = json_input();
$currentPassword = $input['currentPassword'] ?? '';
$newPassword = $input['newPassword'] ?? '';
$userId = $input['userId'] ?? '';
$userRole = $input['userRole'] ?? '';

if (empty($currentPassword) || empty($newPassword) || empty($userId)) {
    respond(['error' => 'Current password, new password, and user ID are required'], 400);
}

if (strlen($newPassword) < 6) {
    respond(['error' => 'New password must be at least 6 characters long'], 400);
}

// Handle password change based on user role
if ($userRole === 'student') {
    $studentModel = new Student($db);
    $user = $studentModel->getById($userId);

    if (!$user) {
        respond(['error' => 'Student not found'], 404);
    }

    // Verify current password
    if (!password_verify($currentPassword, $user['password'])) {
        respond(['error' => 'Current password is incorrect'], 401);
    }

    // Update password using model method
    if ($studentModel->changePassword($userId, $newPassword)) {
        respond(['success' => true, 'message' => 'Password changed successfully'], 200);
    } else {
        respond(['error' => 'Failed to change password'], 500);
    }
} elseif ($userRole === 'teacher' || $userRole === 'admin') {
    $teacherModel = new Teacher($db);
    $user = $teacherModel->getById($userId);

    if (!$user) {
        respond(['error' => 'Teacher not found'], 404);
    }

    // Verify current password
    if (!password_verify($currentPassword, $user['password'])) {
        respond(['error' => 'Current password is incorrect'], 401);
    }

    // Update password using model method
    if ($teacherModel->changePassword($userId, $newPassword)) {
        respond(['success' => true, 'message' => 'Password changed successfully'], 200);
    } else {
        respond(['error' => 'Failed to change password'], 500);
    }
} else {
    respond(['error' => 'Unauthorized'], 403);
}
?>
