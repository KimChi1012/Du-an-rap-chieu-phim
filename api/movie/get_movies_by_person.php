<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

if (!isset($_GET['name']) || !isset($_GET['type'])) {
    echo json_encode(["error" => "Thiếu thông tin tìm kiếm"], JSON_UNESCAPED_UNICODE);
    exit;
}

$name = mysqli_real_escape_string($conn, $_GET['name']);
$type = mysqli_real_escape_string($conn, $_GET['type']);

$movies = [];

if ($type === 'director') {
    $sql = "SELECT * FROM Phim 
            WHERE DaoDien LIKE '%$name%' 
            ORDER BY NgayKhoiChieu DESC";
} elseif ($type === 'actor') {
    $sql = "SELECT * FROM Phim 
            WHERE DienVien LIKE '%$name%' 
            ORDER BY NgayKhoiChieu DESC";
} else {
    echo json_encode(["error" => "Loại tìm kiếm không hợp lệ"], JSON_UNESCAPED_UNICODE);
    exit;
}

$result = mysqli_query($conn, $sql);

if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $movies[] = $row;
    }
}

$response = [
    'movies' => $movies,
    'searchName' => $name,
    'searchType' => $type,
    'total' => count($movies)
];

echo json_encode($response, JSON_UNESCAPED_UNICODE);

mysqli_close($conn);
?>