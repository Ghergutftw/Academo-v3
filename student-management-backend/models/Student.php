<?php
class Student {
    private $conn;
    private $table_name = "students";

    public $id;
    public $name;
    public $email;
    public $password;
    public $group_id;
    public $start_year;
    public $study_cycle;
    public $study_year;
    public $financing_type;
    public $student_status;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAll($year = null) {
        $query = "SELECT s.*, sg.name as group_name 
                  FROM " . $this->table_name . " s 
                  LEFT JOIN student_groups sg ON s.group_id = sg.id";
        if ($year !== null) {
            $query .= " WHERE s.start_year = :year";
        }
        $query .= " ORDER BY s.name";
        $stmt = $this->conn->prepare($query);
        if ($year !== null) {
            $stmt->bindParam(':year', $year, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt;
    }

    public function getByGroup($groupId) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE group_id = ? ORDER BY name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$groupId]);
        return $stmt;
    }

    public function create($name, $email, $password, $group_id, $start_year = null, $study_cycle = 'Licenta', $study_year = 1, $financing_type = 'Buget', $student_status = 'Activ') {
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $query = "INSERT INTO " . $this->table_name . " (name, email, password, group_id, start_year, study_cycle, study_year, financing_type, student_status) VALUES (:name, :email, :password, :group_id, :start_year, :study_cycle, :study_year, :financing_type, :student_status)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":name", $name);
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":password", $hashedPassword);
        $stmt->bindParam(":group_id", $group_id, PDO::PARAM_INT);
        $stmt->bindParam(":start_year", $start_year, PDO::PARAM_INT);
        $stmt->bindParam(":study_cycle", $study_cycle);
        $stmt->bindParam(":study_year", $study_year, PDO::PARAM_INT);
        $stmt->bindParam(":financing_type", $financing_type);
        $stmt->bindParam(":student_status", $student_status);


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

    public function getByEmail($email) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE email = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$email]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function update($id, $name, $email, $group_id, $password = null, $start_year = null, $study_cycle = 'Licenta', $study_year = 1, $financing_type = 'Buget', $student_status = 'Activ') {
        if ($password !== null) {
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $query = "UPDATE " . $this->table_name . " SET name = :name, email = :email, password = :password, group_id = :group_id, start_year = :start_year, study_cycle = :study_cycle, study_year = :study_year, financing_type = :financing_type, student_status = :student_status WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $stmt->bindParam(":name", $name);
            $stmt->bindParam(":email", $email);
            $stmt->bindParam(":password", $hashedPassword);
            $stmt->bindParam(":group_id", $group_id, PDO::PARAM_INT);
            $stmt->bindParam(":start_year", $start_year, PDO::PARAM_INT);
            $stmt->bindParam(":study_cycle", $study_cycle);
            $stmt->bindParam(":study_year", $study_year, PDO::PARAM_INT);
            $stmt->bindParam(":financing_type", $financing_type);
            $stmt->bindParam(":student_status", $student_status);
        } else {
            $query = "UPDATE " . $this->table_name . " SET name = :name, email = :email, group_id = :group_id, start_year = :start_year, study_cycle = :study_cycle, study_year = :study_year, financing_type = :financing_type, student_status = :student_status WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $id, PDO::PARAM_INT);
            $stmt->bindParam(":name", $name);
            $stmt->bindParam(":email", $email);
            $stmt->bindParam(":group_id", $group_id, PDO::PARAM_INT);
            $stmt->bindParam(":start_year", $start_year, PDO::PARAM_INT);
            $stmt->bindParam(":study_cycle", $study_cycle);
            $stmt->bindParam(":study_year", $study_year, PDO::PARAM_INT);
            $stmt->bindParam(":financing_type", $financing_type);
            $stmt->bindParam(":student_status", $student_status);
        }
        return $stmt->execute();
    }

    public function delete($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }

    public function getByStudyGroup($studyGroupId) {
        $query = "SELECT s.* FROM " . $this->table_name . " s
              INNER JOIN study_group_members sgm ON s.id = sgm.student_id
              WHERE sgm.study_group_id = ?
              ORDER BY s.name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$studyGroupId]);
        return $stmt;
    }

    public function getMyGroupmates($studentId) {
        $student = $this->getById($studentId);
        if (!$student || !$student['group_id']) {
            return null;
        }

        $query = "SELECT s.id, s.name, s.email, s.group_id, g.name as group_name
              FROM " . $this->table_name . " s
              LEFT JOIN student_groups g ON s.group_id = g.id
              WHERE s.group_id = ?
              ORDER BY s.name";

        $stmt = $this->conn->prepare($query);
        $stmt->execute([$student['group_id']]);
        $groupmates = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'group_id' => $student['group_id'],
            'group_name' => $groupmates[0]['group_name'] ?? 'N/A',
            'students' => $groupmates
        ];
    }

    public function getPreviousActivities($studentId) {
        $query = "SELECT 
                a.id,
                c.name as course_name,
                c.id as course_id,
                sg.name as group_name,
                sg.id as group_id,
                s.laboratory_number as lab_number,
                l.topic,
                s.session_date as activity_date,
                a.status as attendance_status,
                c.semester,
                c.year
            FROM attendance a
            JOIN sessions s ON a.session_id = s.id
            JOIN study_groups sg ON s.study_group_id = sg.id
            JOIN courses c ON sg.course_id = c.id
            LEFT JOIN laboratories l ON l.course_id = c.id AND l.lab_number = s.laboratory_number
            WHERE a.student_id = ? AND s.session_date <= NOW()
            ORDER BY s.session_date DESC, c.name, s.laboratory_number";

        $stmt = $this->conn->prepare($query);
        $stmt->execute([$studentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getStudentGroups($studentId) {
        $query = "SELECT DISTINCT sg.id, sg.name, c.name as course_name
              FROM study_groups sg
              JOIN study_group_members sgm ON sgm.study_group_id = sg.id
              JOIN courses c ON sg.course_id = c.id
              WHERE sgm.student_id = ?
              ORDER BY sg.name";

        $stmt = $this->conn->prepare($query);
        $stmt->execute([$studentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }


    public function changePassword($studentId, $newPassword) {
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $query = "UPDATE " . $this->table_name . " SET password = :password WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->bindParam(':id', $studentId, PDO::PARAM_INT);
        return $stmt->execute();
    }
}
?>
