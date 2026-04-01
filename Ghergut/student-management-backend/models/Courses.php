<?php
class Courses {
    private $conn;
    private $table_name = "courses";

    public $id;
    public $name;
    public $acronym;
    public $teacher_id;
    public $year;
    public $semester;
    public $is_optional;
    public $course_file;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAll($year = null, $semester = null) {
        $query = "SELECT * FROM " . $this->table_name;
        $conditions = [];
        $params = [];
        
        if ($year !== null) {
            $conditions[] = "year = ?";
            $params[] = $year;
        }
        
        if ($semester !== null) {
            $conditions[] = "semester = ?";
            $params[] = $semester;
        }
        
        if (!empty($conditions)) {
            $query .= " WHERE " . implode(" AND ", $conditions);
        }
        
        $query .= " ORDER BY year, semester, name";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute($params);
        return $stmt;
    }

    public function getByTeacher($teacherId) {
        $query = "SELECT DISTINCT c.*
                  FROM " . $this->table_name . " c
                  LEFT JOIN course_lab_instructors cli ON cli.course_id = c.id
                  WHERE c.teacher_id = ? OR cli.teacher_id = ?
                  ORDER BY c.name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$teacherId, $teacherId]);
        return $stmt;
    }

    public function create($name, $acronym, $teacher_id, $year = 1, $semester = 1, $is_optional = false) {
        $query = "INSERT INTO " . $this->table_name . " (name, acronym, teacher_id, year, semester, is_optional) VALUES (:name, :acronym, :teacher_id, :year, :semester, :is_optional)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":name", $name);
        $stmt->bindParam(":acronym", $acronym);
        $stmt->bindParam(":teacher_id", $teacher_id);
        $stmt->bindParam(":year", $year, PDO::PARAM_INT);
        $stmt->bindParam(":semester", $semester, PDO::PARAM_INT);
        $stmt->bindParam(":is_optional", $is_optional, PDO::PARAM_BOOL);

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

    public function update($id, $name, $acronym, $teacher_id, $year = 1, $semester = 1, $is_optional = false) {
        $query = "UPDATE " . $this->table_name . " SET name = :name, acronym = :acronym, teacher_id = :teacher_id, year = :year, semester = :semester, is_optional = :is_optional WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":name", $name);
        $stmt->bindParam(":acronym", $acronym);
        $stmt->bindParam(":teacher_id", $teacher_id);
        $stmt->bindParam(":year", $year, PDO::PARAM_INT);
        $stmt->bindParam(":semester", $semester, PDO::PARAM_INT);
        $stmt->bindParam(":is_optional", $is_optional, PDO::PARAM_BOOL);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }

    public function delete($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }

    // Update the course_file column (stores relative path like "{year}/{semester}/file.xlsx")
    public function setCourseFile($id, $path) {
        $query = "UPDATE " . $this->table_name . " SET course_file = :course_file WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        return $stmt->execute([':course_file' => $path, ':id' => $id]);
    }

    public function getStudentCoursesWithInstructors($studentId) {
        // 1. Get student info (study_year and study_cycle)
        $studentSql = "SELECT study_year, study_cycle FROM students WHERE id = ?";
        $studentStmt = $this->conn->prepare($studentSql);
        $studentStmt->execute([$studentId]);
        $student = $studentStmt->fetch(PDO::FETCH_ASSOC);

        if (!$student) {
            return [];
        }

        $studyYear = $student['study_year'] ?? 1;
        $studyCycle = $student['study_cycle'] ?? 'Licenta';

        // 2. Build conditions for which courses to show
        // Licență: An 1 -> year 1, An 2 -> years 1-2, An 3 -> years 1-3, An 4 -> years 1-4
        // Master: Show all courses (years 1-4)

        if ($studyCycle === 'Master') {
            // Master students see all courses
            $sql = "SELECT c.*, t.name as teacher_name, t.email as teacher_email
                FROM " . $this->table_name . " c
                LEFT JOIN teachers t ON t.id = c.teacher_id
                ORDER BY c.year, c.semester, c.name";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute();
        } else {
            // Licență students see courses up to their current year
            $sql = "SELECT c.*, t.name as teacher_name, t.email as teacher_email
                FROM " . $this->table_name . " c
                LEFT JOIN teachers t ON t.id = c.teacher_id
                WHERE c.year <= ?
                ORDER BY c.year, c.semester, c.name";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$studyYear]);
        }

        $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 3. Pentru fiecare curs, atașăm instructorii de laborator
        foreach ($courses as &$course) {
            $labSql = "SELECT cli.*, t.name as teacher_name, t.email as teacher_email 
                   FROM course_lab_instructors cli
                   LEFT JOIN teachers t ON cli.teacher_id = t.id
                   WHERE cli.course_id = ?
                   ORDER BY t.name";
            $labStmt = $this->conn->prepare($labSql);
            $labStmt->execute([$course['id']]);
            $course['lab_instructors'] = $labStmt->fetchAll(PDO::FETCH_ASSOC);
        }

        return $courses;
    }
}

