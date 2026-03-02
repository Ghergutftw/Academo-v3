<?php
require_once __DIR__ . '/../enums/UserRole.php';

class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $email;
    public $password;
    public $role;
    public $user_type_id;
    public $created_at;
    public $last_login;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function login($email, $password) {
        $query = "SELECT id, email, password, role, user_type_id, name 
                  FROM " . $this->table_name . " 
                  WHERE email = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password'])) {
            // Update last login
            $updateQuery = "UPDATE " . $this->table_name . " SET last_login = NOW() WHERE id = ?";
            $updateStmt = $this->conn->prepare($updateQuery);
            $updateStmt->execute([$user['id']]);
            
            return $user;
        }
        return false;
    }

    public function getById($id) {
        $query = "SELECT id, email, role, user_type_id, name FROM " . $this->table_name . " WHERE id = ? LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($email, $password, $role, $user_type_id) {
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $query = "INSERT INTO " . $this->table_name . " (email, password, role, user_type_id) 
                  VALUES (:email, :password, :role, :user_type_id)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":password", $hashedPassword);
        $stmt->bindParam(":role", $role);
        $stmt->bindParam(":user_type_id", $user_type_id);
        return $stmt->execute();
    }

    public function getUserDetails($role, $user_type_id) {
        if ($role === UserRole::TEACHER) {
            $query = "SELECT * FROM teachers WHERE id = ?";
        } else if ($role === UserRole::STUDENT) {
            $query = "SELECT * FROM students WHERE id = ?";
        } else {
            return ['name' => 'Administrator', 'email' => 'admin@school.com'];
        }
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$user_type_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}

