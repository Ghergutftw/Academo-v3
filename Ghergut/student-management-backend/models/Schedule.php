<?php

class Schedule {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    /**
     * Save schedule file info to database using PDO
     */
    public function save($fileName, $filePath, $uploadedBy, $year = null) {
        if (!$year) {
            $year = date('Y');
        }

        $query = "
            INSERT INTO schedules (file_name, file_path, uploaded_by, year, uploaded_at, updated_at)
            VALUES (:file_name, :file_path, :uploaded_by, :year, NOW(), NOW())
            ON DUPLICATE KEY UPDATE
                file_name = VALUES(file_name),
                file_path = VALUES(file_path),
                uploaded_by = VALUES(uploaded_by),
                updated_at = NOW()
        ";

        try {
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                ':file_name' => $fileName,
                ':file_path' => $filePath,
                ':uploaded_by' => $uploadedBy,
                ':year' => $year
            ]);
            return true;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Get schedule for a year using PDO
     */
    public function getByYear($year = null) {
        if (!$year) {
            $year = date('Y');
        }

        $query = "
            SELECT id, file_name, file_path, uploaded_by, year, uploaded_at, updated_at
            FROM schedules
            WHERE year = :year
            ORDER BY updated_at DESC
            LIMIT 1
        ";

        try {
            $stmt = $this->db->prepare($query);
            $stmt->execute([':year' => $year]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row;
        } catch (PDOException $e) {
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Check if schedule exists in database
     */
    public function exists($year = null) {
        $schedule = $this->getByYear($year);
        return $schedule !== null && $schedule !== false;
    }
}
?>

