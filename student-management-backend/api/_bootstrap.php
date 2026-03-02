<?php
// api/_bootstrap.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

// Turn off regular display of errors and ensure we capture them to return JSON
ini_set('display_errors', '0');
error_reporting(E_ALL);

// Convert PHP warnings/notices to exceptions so they can be handled as JSON
set_error_handler(function($severity, $message, $file, $line) {
    // Respect error_reporting level
    if (!(error_reporting() & $severity)) {
        return false; // let PHP handle it
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});

// Shutdown handler to catch fatal errors
register_shutdown_function(function() {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Fatal error', 'message' => $err['message'], 'file' => $err['file'], 'line' => $err['line']]);
        exit;
    }
});

// Exception handler to return JSON
set_exception_handler(function($e) {
    http_response_code(500);
    header('Content-Type: application/json');
    $payload = ['error' => 'Unhandled exception', 'message' => $e->getMessage()];
    // Include file/line in debug mode - remove or restrict for production
    if (defined('DEBUG') && DEBUG) {
        $payload['file'] = $e->getFile();
        $payload['line'] = $e->getLine();
        $payload['trace'] = $e->getTraceAsString();
    }
    echo json_encode($payload);
    exit;
});

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/Student.php';
require_once __DIR__ . '/../models/Teacher.php';
require_once __DIR__ . '/../models/StudentGroups.php';
require_once __DIR__ . '/../models/Attendance.php';
require_once __DIR__ . '/../models/Courses.php';
require_once __DIR__ . '/../models/StudyGroup.php';
require_once __DIR__ . '/../models/StudyGroupMember.php';
require_once __DIR__ . '/../models/CourseLabInstructor.php';
require_once __DIR__ . '/../models/ExamSchedule.php';
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

function getCurrentUser(): ?array {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    return $_SESSION['user'] ?? null;
}
