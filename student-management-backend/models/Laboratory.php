<?php
class Laboratory {
    private $conn;
    private $table_name = "laboratories";

    public $id;
    public $course_id;
    public $lab_number;
    public $topic;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getByCourse($courseId) {
        $query = "SELECT * FROM " . $this->table_name . " 
                 WHERE course_id = ? 
                 ORDER BY lab_number ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$courseId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function updateTopic($id, $topic) {
        $query = "UPDATE " . $this->table_name . " 
                 SET topic = :topic 
                 WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":topic", $topic);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }

    public function createForCourse($courseId) {
        $query = "INSERT INTO " . $this->table_name . " 
                 (course_id, lab_number, topic) 
                 VALUES (?, ?, ?)";
        $stmt = $this->conn->prepare($query);

        $this->conn->beginTransaction();
        try {
            for ($i = 1; $i <= 14; $i++) {
                $topic = "Laboratory " . $i;
                $stmt->execute([$courseId, $i, $topic]);
            }
            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            $this->conn->rollBack();
            return false;
        }
    }

    public function getById($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE id = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getByNumber($courseId, $labNumber) {
        $query = "SELECT * FROM " . $this->table_name . " 
                 WHERE course_id = ? AND lab_number = ? 
                 LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$courseId, $labNumber]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}

