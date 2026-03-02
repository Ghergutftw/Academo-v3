<?php

class Attendance
{
    private $conn;
    private $table_name = "attendance";

    public $id;
    public $student_id;
    public $session_id;
    public $status;
    public $recorded_at;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function markAttendance()
    {
        $query = "INSERT INTO " . $this->table_name . " (session_id, student_id, status, recorded_at) 
                  VALUES (:session_id, :student_id, :status, NOW())
                  ON DUPLICATE KEY UPDATE status = :status, recorded_at = NOW()";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":session_id", $this->session_id);
        $stmt->bindParam(":student_id", $this->student_id);
        $stmt->bindParam(":status", $this->status);
        return $stmt->execute();
    }

    public function getAll()
    {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY recorded_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function getBySession($sessionId)
    {
        $query = "SELECT a.*, s.name as student_name
                 FROM " . $this->table_name . " a
                 JOIN students s ON a.student_id = s.id
                 WHERE a.session_id = ?
                 ORDER BY s.name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$sessionId]);
        return $stmt;
    }

    public function getByStudent($studentId)
    {
        $query = "SELECT a.*, ses.session_date, c.name as course_name
                 FROM " . $this->table_name . " a
                 JOIN sessions ses ON a.session_id = ses.id
                 JOIN courses c ON ses.course_id = c.id
                 WHERE a.student_id = ?
                 ORDER BY ses.session_date DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$studentId]);
        return $stmt;
    }

    public function update($id, $student_id, $session_id, $status)
    {
        $query = "UPDATE " . $this->table_name . " SET student_id = :student_id, session_id = :session_id, status = :status WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":student_id", $student_id);
        $stmt->bindParam(":session_id", $session_id);
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }

    public function delete($id)
    {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }

    public function getBySessions($sessionIdsArray)
    {
        if (empty($sessionIdsArray)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($sessionIdsArray), '?'));

        $query = "SELECT a.*, s.name as student_name, s.email as student_email
              FROM " . $this->table_name . " a
              JOIN students s ON a.student_id = s.id
              WHERE a.session_id IN ($placeholders)
              ORDER BY a.session_id, s.name";

        $stmt = $this->conn->prepare($query);
        $stmt->execute($sessionIdsArray);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getDetailedHistoryByStudent($studentId)
    {
        $query = "SELECT COALESCE(a.id, 0) as id,
                         COALESCE(a.status, 'absent') as status,
                         COALESCE(a.recorded_at, NOW()) as recorded_at,
                         s.id AS session_id,
                         s.session_date,
                         s.topic,
                         s.laboratory_number,
                         c.id AS course_id,
                         c.name AS course_name,
                         sg.id AS study_group_id,
                         sg.name AS study_group_name,
                         t.name AS teacher_name
              FROM study_group_members sgm
              JOIN study_groups sg ON sgm.study_group_id = sg.id
              JOIN courses c ON c.id = sg.course_id
              LEFT JOIN sessions s ON s.study_group_id = sg.id
              LEFT JOIN attendance a ON a.session_id = s.id AND a.student_id = sgm.student_id
              LEFT JOIN teachers t ON t.id = c.teacher_id
              WHERE sgm.student_id = ?
              ORDER BY s.session_date DESC, s.laboratory_number DESC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute([$studentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getStatsByCourse($studentId)
    {
        $query = "SELECT 
        c.id as course_id,
        c.name as course_name,
        c.description as course_description,
        COUNT(DISTINCT s.id) as total_sessions,
        COALESCE(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END), 0) as present_count,
        COALESCE(SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END), 0) as absent_count,
        CASE 
            WHEN COUNT(DISTINCT s.id) > 0 THEN ROUND((COALESCE(SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END), 0) / COUNT(DISTINCT s.id)) * 100, 2)
            ELSE 0
        END as attendance_percentage
    FROM students st
    JOIN study_group_members sgm ON st.id = sgm.student_id
    JOIN study_groups sg ON sgm.study_group_id = sg.id
    JOIN courses c ON sg.course_id = c.id
    LEFT JOIN sessions s ON c.id = s.course_id AND s.study_group_id = sg.id
    LEFT JOIN attendance a ON s.id = a.session_id AND a.student_id = st.id
    WHERE st.id = ?
    GROUP BY c.id, c.name, c.description
    HAVING COUNT(DISTINCT s.id) > 0
    ORDER BY c.name";

        $stmt = $this->conn->prepare($query);
        $stmt->execute([$studentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getStatsByStudent($studentId) {
        $query = "SELECT 
                c.id as course_id,
                c.name as course_name,
                COUNT(DISTINCT s.id) as total_sessions,
                SUM(CASE WHEN COALESCE(a.status, 'absent') = 'present' THEN 1 ELSE 0 END) as present_count,
                SUM(CASE WHEN COALESCE(a.status, 'absent') = 'absent' THEN 1 ELSE 0 END) as absent_count,
                CASE
                    WHEN COUNT(DISTINCT s.id) > 0 THEN ROUND((SUM(CASE WHEN COALESCE(a.status, 'absent') = 'present' THEN 1 ELSE 0 END) / COUNT(DISTINCT s.id)) * 100, 2)
                    ELSE 0
                END as attendance_percentage
              FROM study_group_members sgm
              JOIN study_groups sg ON sgm.study_group_id = sg.id
              JOIN courses c ON c.id = sg.course_id
              LEFT JOIN sessions s ON s.study_group_id = sg.id
              LEFT JOIN attendance a ON a.session_id = s.id AND a.student_id = sgm.student_id
              WHERE sgm.student_id = ?
              GROUP BY c.id, c.name
              HAVING COUNT(DISTINCT s.id) > 0
              ORDER BY c.name";

        $stmt = $this->conn->prepare($query);
        $stmt->execute([$studentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function save($sessionId, $records) {
        try {
            $this->conn->beginTransaction();

            $query = "INSERT INTO " . $this->table_name . " (session_id, student_id, status, recorded_at)
                  VALUES (?, ?, ?, NOW())
                  ON DUPLICATE KEY UPDATE status = VALUES(status), recorded_at = NOW()";
            $stmt = $this->conn->prepare($query);

            foreach ($records as $record) {
                $studentId = filter_var($record['student_id'] ?? null, FILTER_VALIDATE_INT);
                $status = strtolower(trim((string)($record['status'] ?? 'present')));

                if (!$studentId) continue;

                if (!in_array($status, ['present', 'absent'], true)) {
                    $status = 'present';
                }

                $stmt->execute([$sessionId, $studentId, $status]);
            }

            $this->conn->commit();
            return true;
        } catch (Throwable $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            error_log($e->getMessage());
            return false;
        }
    }
}
