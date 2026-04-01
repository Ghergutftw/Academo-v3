<?php
// Always send CORS headers first, including for preflight requests.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
    'http://localhost:4200',
    'http://127.0.0.1:4200'
];

if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
} else {
    header('Access-Control-Allow-Origin: http://localhost:4200');
}

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Max-Age: 86400');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

ini_set('display_errors', '0');
error_reporting(E_ALL);

function sendJsonError(string $message, int $statusCode = 500): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

$autoloadCandidates = [
    __DIR__ . '/../../vendor/autoload.php',
    __DIR__ . '/../../../vendor/autoload.php'
];

$autoloadPath = null;
foreach ($autoloadCandidates as $candidate) {
    if (is_file($candidate)) {
        $autoloadPath = $candidate;
        break;
    }
}

if ($autoloadPath === null) {
    sendJsonError('Lipseste autoload Composer. Ruleaza `composer install` in `student-management-backend`.', 500);
}

require_once $autoloadPath;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;

// Opresc orice output anterior
while (ob_get_level()) {
    ob_end_clean();
}

try {
    
    // Citesc datele din request
    $input = json_decode(file_get_contents('php://input'), true);
    error_log("Export Excel: Input data = " . json_encode($input));
    
    if (!is_array($input)) {
        error_log("Export Excel: Date de intrare invalide");
        sendJsonError('Date de intrare invalide', 400);
    }
    
    $courseId = $input['course_id'] ?? null;
    $courseName = $input['course_name'] ?? 'Materie necunoscuta';
    $groupId = $input['group_id'] ?? null;
    $groupName = $input['group_name'] ?? 'Grupa necunoscuta';
    $students = $input['students'] ?? [];
    
    // Creez spreadsheet-ul
    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();
    $sheet->setTitle('Prezenta');
    
    // Header principal
    $sheet->setCellValue('A1', 'TABEL DE PREZENȚĂ');
    $sheet->mergeCells('A1:P1');
    $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
    $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
    
    // Informații
    $sheet->setCellValue('A2', 'Materia: ' . $courseName);
    $sheet->setCellValue('A3', 'Grupa: ' . $groupName);
    $sheet->setCellValue('A4', 'Data: ' . date('d.m.Y H:i'));
    
    // Header tabel
    $currentRow = 6;
    $sheet->setCellValue('A' . $currentRow, 'Student');
    $sheet->setCellValue('B' . $currentRow, 'Email');
    
    // Coloane laboratoare
    for ($i = 1; $i <= 14; $i++) {
        $column = chr(66 + $i); // C, D, E, etc.
        $sheet->setCellValue($column . $currentRow, 'Lab ' . $i);
    }
    
    // Coloană pentru total prezențe per student
    $sheet->setCellValue('Q' . $currentRow, 'Total Prezent');
    
    // Stil header
    $headerRange = 'A' . $currentRow . ':Q' . $currentRow;
    $sheet->getStyle($headerRange)->getFill()
        ->setFillType(Fill::FILL_SOLID)
        ->getStartColor()->setRGB('4472C4');
    $sheet->getStyle($headerRange)->getFont()
        ->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFFFFF'))
        ->setBold(true);
    
    $currentRow++;
    
    // Date studenți
    foreach ($students as $student) {
        $sheet->setCellValue('A' . $currentRow, $student['name'] ?? '');
        $sheet->setCellValue('B' . $currentRow, $student['email'] ?? '');
        
        $studentPresentCount = 0; // Counter pentru prezențele acestui student
        
        // Prezența
        if (isset($student['attendance'])) {
            for ($i = 0; $i < 14 && $i < count($student['attendance']); $i++) {
                $attendance = $student['attendance'][$i];
                $column = chr(67 + $i); // C, D, E, etc.
                
                $status = '';
                switch ($attendance['status'] ?? '') {
                    case 'present': 
                        $status = 'P'; 
                        $studentPresentCount++; // Incrementez pentru acest student
                        break;
                    case 'absent': $status = 'A'; break;
                    default: $status = '-';
                }
                
                $sheet->setCellValue($column . $currentRow, $status);
            }
        }
        
        // Afișez totalul de prezențe pentru acest student
        $sheet->setCellValue('Q' . $currentRow, $studentPresentCount . '/14');
        $sheet->getStyle('Q' . $currentRow)->getFont()->setBold(true);
        $sheet->getStyle('Q' . $currentRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        
        $currentRow++;
    }
    
    // Setez lățimi coloane
    $sheet->getColumnDimension('A')->setWidth(25);
    $sheet->getColumnDimension('B')->setWidth(30);
    for ($i = 0; $i < 14; $i++) {
        $column = chr(67 + $i);
        $sheet->getColumnDimension($column)->setWidth(8);
    }
    // Coloană total prezențe
    $sheet->getColumnDimension('Q')->setWidth(12);
    
    // Numele fișierului
    $filename = 'prezenta_' . date('Y-m-d') . '.xlsx';
    $filename = preg_replace('/[^a-zA-Z0-9._\-]/', '_', $filename);
    
    // Headers pentru descărcare
    if (headers_sent()) {
        throw new RuntimeException('Headers already sent before file output');
    }

    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT');
    header('Pragma: public');
    
    // Salvez direct
    $writer = new Xlsx($spreadsheet);
    error_log("Export Excel: Generez fisierul Excel...");
    $writer->save('php://output');
    error_log("Export Excel: Fisier generat cu succes");
    exit;

} catch (Throwable $e) {
    error_log("Export Excel: EROARE - " . $e->getMessage());
    error_log("Export Excel: Stack trace - " . $e->getTraceAsString());

    if (!headers_sent()) {
        sendJsonError('Eroare export Excel: ' . $e->getMessage(), 500);
    }
}
