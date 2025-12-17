<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

$sql = "SELECT * FROM QuangCao ORDER BY MaQC ASC";
$result = mysqli_query($conn, $sql);

$banners = [];
if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $banners[] = $row;
    }
}

echo json_encode($banners, JSON_UNESCAPED_UNICODE);

mysqli_close($conn);
?>
