<?php

class StudyGroupMember
{
    private $conn;
    private $table = 'study_group_members';

    public $id;
    public $study_group_id;
    public $student_id;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    // Add a student to a study group
    public function create()
    {
        $query = "INSERT INTO " . $this->table . " 
                  SET study_group_id = :study_group_id, 
                      student_id = :student_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->study_group_id = htmlspecialchars(strip_tags($this->study_group_id));
        $this->student_id = htmlspecialchars(strip_tags($this->student_id));

        // Bind
        $stmt->bindParam(':study_group_id', $this->study_group_id);
        $stmt->bindParam(':student_id', $this->student_id);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    // Add multiple students to a study group
    public function addStudents($study_group_id, $student_ids)
    {
        if (empty($student_ids)) {
            return true; // Nothing to add
        }

        $this->conn->beginTransaction();

        try {
            $query = "INSERT IGNORE INTO " . $this->table . " 
                      (study_group_id, student_id) 
                      VALUES (:study_group_id, :student_id)";
            
            $stmt = $this->conn->prepare($query);

            foreach ($student_ids as $student_id) {
                $stmt->bindParam(':study_group_id', $study_group_id, PDO::PARAM_INT);
                $stmt->bindParam(':student_id', $student_id, PDO::PARAM_INT);
                $stmt->execute();
            }

            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            $this->conn->rollBack();
            error_log("Error adding students: " . $e->getMessage());
            return false;
        }
    }

    // Remove a student from a study group
    public function delete()
    {
        $query = "DELETE FROM " . $this->table . " 
                  WHERE study_group_id = :study_group_id 
                  AND student_id = :student_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize
        $this->study_group_id = htmlspecialchars(strip_tags($this->study_group_id));
        $this->student_id = htmlspecialchars(strip_tags($this->student_id));

        // Bind
        $stmt->bindParam(':study_group_id', $this->study_group_id);
        $stmt->bindParam(':student_id', $this->student_id);

        return $stmt->execute();
    }

    // Remove all students from a study group
    public function deleteByStudyGroup($study_group_id)
    {
        $query = "DELETE FROM " . $this->table . " 
                  WHERE study_group_id = :study_group_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':study_group_id', $study_group_id);

        return $stmt->execute();
    }

    // Get all members of a study group
    public function getByStudyGroup($study_group_id)
    {
         $query = "SELECT sgm.*, s.name as student_name, s.email, 
                    g.name as group_name
                  FROM " . $this->table . " sgm
                  LEFT JOIN students s ON sgm.student_id = s.id
                LEFT JOIN student_groups g ON s.group_id = g.id
                  WHERE sgm.study_group_id = :study_group_id
                  ORDER BY s.name";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':study_group_id', $study_group_id);
        $stmt->execute();

        return $stmt;
    }

    // Check if student is in study group
    public function exists($study_group_id, $student_id)
    {
        $query = "SELECT id FROM " . $this->table . "
                  WHERE study_group_id = :study_group_id 
                  AND student_id = :student_id
                  LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':study_group_id', $study_group_id);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }

    // Replace all members of a study group
    public function replaceMembers($study_group_id, $student_ids)
    {
        error_log("replaceMembers called with group_id: $study_group_id, students: " . json_encode($student_ids));
        
        try {
            $this->conn->beginTransaction();

            // Delete existing members
            $deleteQuery = "DELETE FROM " . $this->table . " WHERE study_group_id = :study_group_id";
            $deleteStmt = $this->conn->prepare($deleteQuery);
            $deleteStmt->bindParam(':study_group_id', $study_group_id, PDO::PARAM_INT);
            
            if (!$deleteStmt->execute()) {
                error_log("Failed to delete existing members");
                $this->conn->rollBack();
                return false;
            }
            
            error_log("Deleted existing members successfully");

            // Add new members
            if (!empty($student_ids)) {
                error_log("Adding " . count($student_ids) . " new members");
                
                $insertQuery = "INSERT INTO " . $this->table . " 
                              (study_group_id, student_id) 
                              VALUES (:study_group_id, :student_id)";
                
                $insertStmt = $this->conn->prepare($insertQuery);

                foreach ($student_ids as $student_id) {
                    $insertStmt->bindParam(':study_group_id', $study_group_id, PDO::PARAM_INT);
                    $insertStmt->bindParam(':student_id', $student_id, PDO::PARAM_INT);
                    
                    if (!$insertStmt->execute()) {
                        error_log("Failed to insert student $student_id: " . json_encode($insertStmt->errorInfo()));
                        $this->conn->rollBack();
                        return false;
                    }
                }
                
                error_log("All students inserted successfully");
            }

            $this->conn->commit();
            error_log("Transaction committed successfully");
            return true;
        } catch (Exception $e) {
            $this->conn->rollBack();
            error_log("Exception in replaceMembers: " . $e->getMessage());
            return false;
        }
    }
}
