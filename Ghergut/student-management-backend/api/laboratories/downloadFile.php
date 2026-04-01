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

// Disable output buffering completely and clear any existing buffers
while (ob_get_level()) {
    ob_end_clean();
}

// Turn off output buffering completely
if (ini_get('output_buffering')) {
    ini_set('output_buffering', 'off');
}
if (ini_get('zlib.output_compression')) {
    ini_set('zlib.output_compression', 'off');
}

// Ensure no whitespace or output before headers
if (!headers_sent()) {
    header('Content-Description: File Transfer');
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $downloadName . '"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($filepath));
}

// Clean the output buffer and send the file
if (ob_get_level()) {
    ob_clean();
}

// Use fpassthru for better memory handling with large files
$handle = fopen($filepath, 'rb');
if ($handle) {
    fpassthru($handle);
    fclose($handle);
} else {
    readfile($filepath);
}
exit;

