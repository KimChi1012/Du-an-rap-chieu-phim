<?php
$host = "localhost"; 
$user = "root";
$password = "";
$dbname = "HighCinema";

$conn = mysqli_connect($host, $user, $password, $dbname);

if (!$conn) {
    die(json_encode(["error" => "Kết nối CSDL thất bại: " . mysqli_connect_error()]));
}

mysqli_set_charset($conn, "utf8mb4");
?>
