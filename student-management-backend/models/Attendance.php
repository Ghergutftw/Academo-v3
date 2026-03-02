<?php
class Attendance {
    private $conn;
    private $table_name = "attendance";

    public $id;
    public $student_id;
    public $session_id;
    public $status;
    public $recorded_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function markAttendance() {
        $query = "INSERT INTO " . $this->table_name . " (session_id, student_id, status, recorded_at) 
                  VALUES (:session_id, :student_id, :status, NOW())
                  ON DUPLICATE KEY UPDATE status = :status, recorded_at = NOW()";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":session_id", $this->session_id);
        $stmt->bindParam(":student_id", $this->student_id);
        $stmt->bindParam(":status", $this->status);
        return $stmt->execute();
    }

    public function getAll() {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY recorded_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function getBySession($sessionId) {
        $query = "SELECT a.*, s.name as student_name
                 FROM " . $this->table_name . " a
                 JOIN students s ON a.student_id = s.id
                 WHERE a.session_id = ?
                 ORDER BY s.name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$sessionId]);
        return $stmt;
    }

    public function getByStudent($studentId) {
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

    public function update($id, $student_id, $session_id, $status) {
        $query = "UPDATE " . $this->table_name . " SET student_id = :student_id, session_id = :session_id, status = :status WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":student_id", $student_id);
        $stmt->bindParam(":session_id", $session_id);
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }

    public function delete($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }
}
