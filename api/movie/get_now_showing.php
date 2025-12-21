<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

$sql = "SELECT * FROM Phim WHERE TrangThai = 'Phim đang chiếu'";
$result = mysqli_query($conn, $sql);

$movies = [];
if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $movies[] = $row;
    }
}

echo json_encode($movies, JSON_UNESCAPED_UNICODE);

mysqli_close($conn);
?>