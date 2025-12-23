<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

$sql = "SELECT * FROM UuDai ORDER BY MaUD ASC";
$result = mysqli_query($conn, $sql);

$offers = [];
if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
        $offers[] = $row;
    }
}

echo json_encode($offers, JSON_UNESCAPED_UNICODE);

mysqli_close($conn);
?>
