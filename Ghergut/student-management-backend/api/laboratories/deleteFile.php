<?php
// Delete a file for a laboratory
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!isset($data['filename'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing filename']);
    exit;
}

$relPath = $data['filename'];
$filepath = __DIR__ . '/../../uploads/laboratory_files/' . $relPath;

if (file_exists($filepath)) {
    if (unlink($filepath)) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete file']);
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'File not found']);
}

