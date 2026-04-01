<?php
class Database {
    private string $host = 'localhost';
    private string $db_name = 'student_management';
    private string $username = 'root';
    private string $password = '';
    private ?\PDO $conn = null;

    public function getConnection(): \PDO {
        if ($this->conn) { return $this->conn; }
        $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        return $this->conn;
    }
}