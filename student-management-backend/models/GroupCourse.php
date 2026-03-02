<?php
class GroupCourse {
    private $conn;
    private $table_name = "group_courses";

    public $id;
    public $group_id;
    public $course_id;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAll() {
        $query = "SELECT gc.*, g.name as group_name, c.name as course_name 
                 FROM " . $this->table_name . " gc
                 JOIN student_groups g ON gc.group_id = g.id
                 JOIN courses c ON gc.course_id = c.id
                 ORDER BY g.name, c.name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function getByGroup($groupId) {
        $query = "SELECT gc.*, c.name as course_name, c.description 
                 FROM " . $this->table_name . " gc
                 JOIN courses c ON gc.course_id = c.id
                 WHERE gc.group_id = ?
                 ORDER BY c.name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$groupId]);
        return $stmt;
    }

    public function getByCourse($courseId) {
        $query = "SELECT gc.*, g.name as group_name, g.year 
                 FROM " . $this->table_name . " gc
                 JOIN student_groups g ON gc.group_id = g.id
                 WHERE gc.course_id = ?
                 ORDER BY g.name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$courseId]);
        return $stmt;
    }

    public function update($id, $group_id, $course_id) {
        $query = "UPDATE " . $this->table_name . " SET group_id = :group_id, course_id = :course_id WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":group_id", $group_id);
        $stmt->bindParam(":course_id", $course_id);
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
