<?php
class Session {
    private $conn;
    private $table_name = "sessions";

    public $id;
    public $course_id;
    public $study_group_id;
    public $laboratory_number;
    public $session_date;
    public $topic;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " (course_id, study_group_id, laboratory_number, session_date, topic) 
                  VALUES (:course_id, :study_group_id, :laboratory_number, :session_date, :topic)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":course_id", $this->course_id);
        $stmt->bindParam(":study_group_id", $this->study_group_id);
        $stmt->bindParam(":laboratory_number", $this->laboratory_number);
        $stmt->bindParam(":session_date", $this->session_date);
        $stmt->bindParam(":topic", $this->topic);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function getById($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getAll() {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY session_date DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function getByCourse($courseId) {
        $query = "SELECT s.*, sg.name as study_group_name 
                 FROM " . $this->table_name . " s
                 LEFT JOIN study_groups sg ON s.study_group_id = sg.id
                 WHERE s.course_id = ? 
                 ORDER BY s.session_date DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$courseId]);
        return $stmt;
    }

    public function update($id, $course_id, $session_date, $topic) {
        $query = "UPDATE " . $this->table_name . " SET course_id = :course_id, session_date = :session_date, topic = :topic WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":course_id", $course_id);
        $stmt->bindParam(":session_date", $session_date);
        $stmt->bindParam(":topic", $topic);
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
?>
