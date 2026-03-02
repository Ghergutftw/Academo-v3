<?php
// Download a file for a laboratory
require_once __DIR__ . '/../_bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    exit;
}

if (!isset($_GET['filename'])) {
    http_response_code(400);
    echo 'Missing filename';
    exit;
}

$relPath = $_GET['filename'];
$filepath = __DIR__ . '/../../uploads/laboratory_files/' . $relPath;

if (!file_exists($filepath)) {
    http_response_code(404);
    echo 'File not found';
    exit;
}

$downloadName = basename($filepath);
header('Content-Description: File Transfer');
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . $downloadName . '"');
header('Expires: 0');
header('Cache-Control: must-revalidate');
header('Pragma: public');
header('Content-Length: ' . filesize($filepath));
readfile($filepath);
exit;

