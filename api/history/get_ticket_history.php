<?php
session_start();
header('Content-Type: application/json');
require __DIR__ . "/../db.php";

// Kiểm tra session đăng nhập
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["message" => "Chưa đăng nhập"]);
    exit;
}

$maND = $_SESSION['user_id'];

// SQL lấy lịch sử đặt vé
$sql = "
    SELECT 
        v.MaVe,
        p.TenPhim,
        p.Poster,
        sc.NgayChieu,
        sc.GioBatDau,
        hd.NgayLap,
        cthd.GiaVe
    FROM HoaDon hd
    JOIN CTHDVe cthd ON hd.MaHD = cthd.MaHD
    JOIN VeSuatChieu v ON cthd.MaVe = v.MaVe
    JOIN SuatChieu sc ON v.MaSuat = sc.MaSuat
    JOIN Phim p ON sc.MaPhim = p.MaPhim
    WHERE hd.MaND = ?
    ORDER BY hd.NgayLap DESC
";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["message" => "Lỗi SQL: " . $conn->error]);
    exit;
}

$stmt->bind_param("s", $maND);
$stmt->execute();
$result = $stmt->get_result();

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

// Trả về JSON
echo json_encode($data, JSON_UNESCAPED_UNICODE);

$stmt->close();
$conn->close();
