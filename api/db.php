<?php
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
