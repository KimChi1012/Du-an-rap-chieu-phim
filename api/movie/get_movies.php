<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

try {
    $sql = "SELECT * FROM Phim ORDER BY MaPhim ASC";
    $result = $conn->query($sql);
    
    $movies = [];
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $movies[] = $row;
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $movies
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>