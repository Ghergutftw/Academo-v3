<?php
require_once __DIR__ . '/../_bootstrap.php';
require_once __DIR__ . '/../../models/Teacher.php';
require_once __DIR__ . '/../../models/Student.php';
require_once __DIR__ . '/../../enums/UserRole.php';

if (!isset($db)) {
    $db = (new Database())->getConnection();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['error' => 'Method not allowed'], 405);
}

  = json_input();
$email = $input['email'] ?? '';
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    respond(['error' => 'Email and password are required'], 400);
}

$teacherModel = new Teacher($db);
$teacher = $teacherModel->getByEmail($email);

// If not found and email doesn't contain @, try with @academic.tuiasi.ro
if (!$teacher && strpos($email, '@') === false) {
    $teacher = $teacherModel->getByEmail($email . '@academic.tuiasi.ro');
}

if ($teacher && password_verify($password, $teacher['password'])) {
    $role = $teacher['is_admin'] ? UserRole::ADMIN : UserRole::TEACHER;
    $claims = [
        'sub' => (int)$teacher['id'],
        'email' => $teacher['email'],
        'role' => $role,
        'user_type_id' => (int)$teacher['id']
    ];

    $response = [
        'success' => true,
        'user' => [
            'id' => $teacher['id'],
            'email' => $teacher['email'],
            'role' => $role,
            'user_type_id' => $teacher['id'],
            'name' => $teacher['name'],
            'is_admin' => (bool)$teacher['is_admin']
        ],
        'token' => createJwt($claims)
    ];
    respond($response, 200);
    exit;
}

// Try to authenticate as student
$studentModel = new Student($db);
$student = $studentModel->getByEmail($email);

// If not found and email doesn't contain @, try with @student.tuiasi.ro
if (!$student && strpos($email, '@') === false) {
    $student = $studentModel->getByEmail($email . '@student.tuiasi.ro');
}

if ($student && password_verify($password, $student['password'])) {
    $claims = [
        'sub' => (int)$student['id'],
        'email' => $student['email'],
        'role' => UserRole::STUDENT,
        'user_type_id' => (int)$student['id']
    ];

    $response = [
        'success' => true,
        'user' => [
            'id' => $student['id'],
            'email' => $student['email'],
            'role' => UserRole::STUDENT,
            'user_type_id' => $student['id'],
            'name' => $student['name'],
            'study_cycle' => $student['study_cycle'] ?? 'Licenta'
        ],
        'token' => createJwt($claims)
    ];
    respond($response, 200);
    exit;
}

respond(['error' => 'Invalid email or password'], 401);

