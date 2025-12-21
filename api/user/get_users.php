<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

try {
    $sql = "SELECT 
        MaND, TenDN, HoTen, SoDT, ThanhPho, NgaySinh,
        Email, MatKhau, QuyenHan, Avatar, NgayTao
    FROM NguoiDung ORDER BY MaND ASC";

    $result = $conn->query($sql);
    
    if (!$result) {
        throw new Exception("Lỗi truy vấn: " . $conn->error);
    }

    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>