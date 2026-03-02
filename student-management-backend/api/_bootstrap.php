<?php
// api/_bootstrap.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/Student.php';
require_once __DIR__ . '/../models/Teacher.php';
require_once __DIR__ . '/../models/Group.php';
require_once __DIR__ . '/../models/Attendance.php';
require_once __DIR__ . '/../models/Courses.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/_auth.php';

$db = (new Database())->getConnection();

function json_input(): array {
    $raw = file_get_contents('php://input');
    return $raw ? (json_decode($raw, true) ?? []) : [];
}

function respond($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}