<?php

class CourseLabInstructor {
    private $conn;
    private $table_name = "course_lab_instructors";

    public $id;
    public $course_id;
    public $teacher_id;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Get all lab instructors for a course
    public function getByCourse($course_id) {
        $query = "SELECT cli.*, t.name as teacher_name, t.email as teacher_email 
                  FROM " . $this->table_name . " cli
                  LEFT JOIN teachers t ON cli.teacher_id = t.id
                  WHERE cli.course_id = :course_id
                  ORDER BY t.name";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":course_id", $course_id);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Add a lab instructor to a course
    public function add() {
        $query = "INSERT INTO " . $this->table_name . " 
                  (course_id, teacher_id) 
                  VALUES (:course_id, :teacher_id)";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":course_id", $this->course_id);
        $stmt->bindParam(":teacher_id", $this->teacher_id);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    // Remove a lab instructor from a course
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " 
                  WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);

        return $stmt->execute();
    }

    // Remove all lab instructors for a course
    public function deleteByCourse($course_id) {
        $query = "DELETE FROM " . $this->table_name . " 
                  WHERE course_id = :course_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":course_id", $course_id);

        return $stmt->execute();
    }

    // Update lab instructors for a course (replace all)
    public function updateByCourse($course_id, $teacher_ids) {
        // Start transaction
        $this->conn->beginTransaction();

        try {
            // Delete existing
            $this->deleteByCourse($course_id);

            // Add new ones
            if (!empty($teacher_ids)) {
                $query = "INSERT INTO " . $this->table_name . " 
                          (course_id, teacher_id) 
                          VALUES (:course_id, :teacher_id)";
                $stmt = $this->conn->prepare($query);

                foreach ($teacher_ids as $teacher_id) {
                    $stmt->bindParam(":course_id", $course_id);
                    $stmt->bindParam(":teacher_id", $teacher_id);
                    $stmt->execute();
                }
            }

            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            $this->conn->rollBack();
            return false;
        }
    }
}
