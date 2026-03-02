<?php
class StudentGroups {
    private $conn;
    private $table_name = "student_groups";

    public $id;
    public $name;
    public $year;
    public $academic_year;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAll() {
        $query = "SELECT * FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function create($name, $year, $academic_year) {
        $query = "INSERT INTO " . $this->table_name . " (name, year, academic_year) VALUES (:name, :year, :academic_year)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":name", $name);
        $stmt->bindParam(":year", $year);
        $stmt->bindParam(":academic_year", $academic_year);

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

    public function update($id, $name, $year, $academic_year) {
        $query = "UPDATE " . $this->table_name . " SET name = :name, year = :year, academic_year = :academic_year WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":name", $name);
        $stmt->bindParam(":year", $year);
        $stmt->bindParam(":academic_year", $academic_year);
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
