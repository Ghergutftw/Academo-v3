<?php
    require_once __DIR__ . '/../_bootstrap.php';

    $body = json_input();
    $sessionId = filter_var($body['session_id'] ?? null, FILTER_VALIDATE_INT);
    $records = $body['records'] ?? [];

    if (!$sessionId || !is_array($records)) {
        respond(['error' => 'Valid session_id and records array are required'], 400);
    }

    try {
        $db->beginTransaction();

        $sql = "INSERT INTO attendance (session_id, student_id, status, recorded_at)
                VALUES (?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE status = VALUES(status), recorded_at = NOW()";
        $stmt = $db->prepare($sql);

        foreach ($records as $record) {
            $studentId = filter_var($record['student_id'] ?? null, FILTER_VALIDATE_INT);
            $status = strtolower(trim((string)($record['status'] ?? 'present')));

            if (!$studentId) {
                continue;
            }

            if (!in_array($status, ['present', 'absent', 'late', 'excused'], true)) {
                $status = 'present';
            }

            $stmt->execute([$sessionId, $studentId, $status]);
        }

        $db->commit();
        respond(['status' => 'success']);
    } catch (Throwable $e) {
        $db->rollBack();
        error_log('Attendance save error: ' . $e->getMessage());
        respond(['error' => 'Failed to save attendance'], 500);
    }