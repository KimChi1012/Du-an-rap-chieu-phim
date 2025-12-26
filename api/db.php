<?php
// Tắt hiển thị lỗi để tránh HTML error pages
error_reporting(0);
ini_set('display_errors', 0);

$host = "localhost"; 
$user = "root";
$password = "";
$dbname = "HighCinema";

$conn = mysqli_connect($host, $user, $password, $dbname);

if (!$conn) {
    header('Content-Type: application/json');
    echo json_encode(["success" => false, "error" => "Kết nối CSDL thất bại: " . mysqli_connect_error()]);
    exit;
}

mysqli_set_charset($conn, "utf8mb4");
?>
