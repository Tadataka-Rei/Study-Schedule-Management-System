<?php
header("Content-Type: application/json");
require './db.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // 1. Get user_id from the URL query string
    $user_id = $_GET['user_id'] ?? '';

    if (empty($user_id)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "user_id is required"]);
        exit;
    }

    try {
        $query = "SELECT subject_name, day_of_week, start_time, end_time 
                  FROM Timetable 
                  WHERE user_id = ? 
                  ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), start_time ASC";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute([$user_id]);
        $schedule = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 3. Check if records exist
        if ($schedule) {
            echo json_encode([
                "status" => "success",
                "user_id" => $user_id,
                "data" => $schedule
            ]);
        } else {
            echo json_encode([
                "status" => "success", 
                "message" => "No schedule found for this user",
                "data" => []
            ]);
        }

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
}