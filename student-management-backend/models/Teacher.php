<?php
class Teacher {
    private $conn;
    private $table_name = "teachers";

    public $id;
    public $name;
    public $email;
    public $password;
    public $is_admin;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getActivities($teacherId) {
        $query = "SELECT 
                    s.id,
                    c.name as course_name,
                    c.id as course_id,
                    sg.name as group_name,
                    sg.id as group_id,
                    s.laboratory_number as lab_number,
                    l.topic,
                    s.session_date,
                    c.semester,
                    c.year
                FROM sessions s
                JOIN study_groups sg ON s.study_group_id = sg.id
                JOIN courses c ON sg.course_id = c.id
                LEFT JOIN laboratories l ON l.course_id = c.id AND l.lab_number = s.laboratory_number
                WHERE c.teacher_id = ? AND s.session_date <= NOW()
                ORDER BY s.session_date DESC, c.name, s.laboratory_number";

        $stmt = $this->conn->prepare($query);
        $stmt->execute([$teacherId]);
        $activities = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map(function($activity) {
            return [
                'id' => (int)$activity['id'],
                'course_name' => $activity['course_name'],
                'course_id' => (int)$activity['course_id'],
                'group_name' => $activity['group_name'],
                'group_id' => (int)$activity['group_id'],
                'lab_number' => (int)$activity['lab_number'],
                'topic' => $activity['topic'],
                'session_date' => $activity['session_date'],
                'semester' => (int)$activity['semester'],
                'year' => (int)$activity['year']
            ];
        }, $activities);
    }

    public function getAll() {
        $query = "SELECT * FROM " . $this->table_name . " ORDER BY name";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function create($name, $email, $password, $is_admin = false) {
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $query = "INSERT INTO " . $this->table_name . " (name, email, password, is_admin) VALUES (:name, :email, :password, :is_admin)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":name", $name);
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":password", $hashedPassword);
        $stmt->bindParam(":is_admin", $is_admin, PDO::PARAM_BOOL);

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

    public function update($id, $name, $email, $password = null, $is_admin = null) {
        if ($password !== null) {
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $query = "UPDATE " . $this->table_name . " SET name = :name, email = :email, password = :password";
            if ($is_admin !== null) {
                $query .= ", is_admin = :is_admin";
            }
            $query .= " WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":name", $name);
            $stmt->bindParam(":email", $email);
            $stmt->bindParam(":password", $hashedPassword);
            if ($is_admin !== null) {
                $stmt->bindParam(":is_admin", $is_admin, PDO::PARAM_BOOL);
            }
            $stmt->bindParam(":id", $id);
        } else {
            $query = "UPDATE " . $this->table_name . " SET name = :name, email = :email";
            if ($is_admin !== null) {
                $query .= ", is_admin = :is_admin";
            }
            $query .= " WHERE id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":name", $name);
            $stmt->bindParam(":email", $email);
            if ($is_admin !== null) {
                $stmt->bindParam(":is_admin", $is_admin, PDO::PARAM_BOOL);
            }
            $stmt->bindParam(":id", $id);
        }
        return $stmt->execute();
    }

    public function delete($id) {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        return $stmt->execute();
    }

    public function getTaughtGroups($teacherId) {
        $query = "SELECT DISTINCT sg.id, sg.name, c.name as course_name
              FROM study_groups sg
              JOIN courses c ON sg.course_id = c.id
              JOIN sessions s ON s.study_group_id = sg.id
              WHERE (
                  c.teacher_id = :tid1
                  OR
                  EXISTS (
                      SELECT 1 FROM course_lab_instructors cli
                      WHERE cli.course_id = c.id AND cli.teacher_id = :tid2
                  )
              )
              ORDER BY sg.name";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':tid1', $teacherId, PDO::PARAM_INT);
        $stmt->bindValue(':tid2', $teacherId, PDO::PARAM_INT);
        $stmt->execute();

        $groups = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map(function($group) {
            return [
                'id' => (int)$group['id'],
                'name' => $group['name'],
                'course_name' => $group['course_name']
            ];
        }, $groups);
    }

    public function changePassword($teacherId, $newPassword) {
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $query = "UPDATE " . $this->table_name . " SET password = :password WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->bindParam(':id', $teacherId, PDO::PARAM_INT);
        return $stmt->execute();
    }
}