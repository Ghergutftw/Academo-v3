<?php

class StudyGroup
{
    private $conn;
    private $table = 'study_groups';

    public $id;
    public $name;
    public $course_id;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function create()
    {
        $query = "INSERT INTO " . $this->table . " SET name = :name, course_id = :course_id";
        $stmt = $this->conn->prepare($query);

        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->course_id = htmlspecialchars(strip_tags($this->course_id));

        $stmt->bindParam(':name', $this->name);
        $stmt->bindParam(':course_id', $this->course_id);

        if ($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        return false;
    }

    public function findByNameAndCourse($name, $course_id)
    {
        $query = "SELECT id, name FROM " . $this->table . " WHERE course_id = ? AND name = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$course_id, $name]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function addStudentsFromAdminGroup($admin_group_id)
    {
        $query = "INSERT IGNORE INTO study_group_members (study_group_id, student_id)
                  SELECT ?, id FROM students WHERE group_id = ?";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([$this->id, $admin_group_id]);
    }

    public function getAll()
    {
        $query = "SELECT sg.*, c.name as course_name, c.is_optional, t.name as teacher_name
                  FROM " . $this->table . " sg
                  LEFT JOIN courses c ON sg.course_id = c.id
                  LEFT JOIN teachers t ON c.teacher_id = t.id
                  ORDER BY sg.name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function getByCourse($course_id)
    {
        $query = "SELECT sg.*, COUNT(DISTINCT sgm.student_id) as student_count
                  FROM " . $this->table . " sg
                  LEFT JOIN study_group_members sgm ON sg.id = sgm.study_group_id
                  WHERE sg.course_id = :course_id
                  GROUP BY sg.id
                  ORDER BY sg.name";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':course_id', $course_id);
        $stmt->execute();
        return $stmt;
    }

    public function getById($id)
    {
        $query = "SELECT sg.*, c.name as course_name, c.is_optional, t.name as teacher_name
                  FROM " . $this->table . " sg
                  LEFT JOIN courses c ON sg.course_id = c.id
                  LEFT JOIN teachers t ON c.teacher_id = t.id
                  WHERE sg.id = :id
                  LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $this->id = $row['id'];
            $this->name = $row['name'];
            $this->course_id = $row['course_id'];
            return true;
        }
        return false;
    }

    public function getByStudent($student_id)
    {
        $query = "SELECT sg.*, c.name as course_name, c.is_optional, t.name as teacher_name
                  FROM " . $this->table . " sg
                  INNER JOIN study_group_members sgm ON sg.id = sgm.study_group_id
                  LEFT JOIN courses c ON sg.course_id = c.id
                  LEFT JOIN teachers t ON c.teacher_id = t.id
                  WHERE sgm.student_id = :student_id
                  ORDER BY sg.name";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':student_id', $student_id);
        $stmt->execute();
        return $stmt;
    }

    public function update()
    {
        $query = "UPDATE " . $this->table . " SET name = :name, course_id = :course_id WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->course_id = htmlspecialchars(strip_tags($this->course_id));
        $this->id = htmlspecialchars(strip_tags($this->id));
        $stmt->bindParam(':name', $this->name);
        $stmt->bindParam(':course_id', $this->course_id);
        $stmt->bindParam(':id', $this->id);
        return $stmt->execute();
    }

    public function delete()
    {
        $query = "DELETE FROM study_group_members WHERE study_group_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();

        $query = "DELETE FROM " . $this->table . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        return $stmt->execute();
    }

    public function getStudents($study_group_id)
    {
        $query = "SELECT s.*, sg.name as group_name
                  FROM students s
                  INNER JOIN study_group_members sgm ON s.id = sgm.student_id
                  LEFT JOIN student_groups sg ON s.group_id = sg.id
                  WHERE sgm.study_group_id = :study_group_id
                  ORDER BY s.name";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':study_group_id', $study_group_id);
        $stmt->execute();
        return $stmt;
    }
}