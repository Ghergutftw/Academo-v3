<?php
class Courses {
    private $conn;
    private $table_name = "courses";

    public $id;
    public $name;
    public $description;
    public $teacher_id;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAll() {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function getByTeacher($teacherId) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE teacher_id = ? ORDER BY name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$teacherId]);
        return $stmt;
    }

    public function create($name, $description, $teacher_id) {
        $query = "INSERT INTO " . $this->table_name . " (name, description, teacher_id) VALUES (:name, :description, :teacher_id)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":name", $name);
        $stmt->bindParam(":description", $description);
        $stmt->bindParam(":teacher_id", $teacher_id);

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

    public function getByName($name) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE name = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$name]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function update($id, $name, $description, $teacher_id) {
        $query = "UPDATE " . $this->table_name . " SET name = :name, description = :description, teacher_id = :teacher_id WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":name", $name);
        $stmt->bindParam(":description", $description);
        $stmt->bindParam(":teacher_id", $teacher_id);
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