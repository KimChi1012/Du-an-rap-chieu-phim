<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

try {
    $sortBy = $_GET['sort'] ?? 'MaND';
    $sortOrder = $_GET['order'] ?? 'ASC';

    $allowedSortFields = ['MaND', 'HoTen', 'Email', 'NgayTao', 'QuyenHan'];
    $allowedSortOrders = ['ASC', 'DESC'];
    
    if (!in_array($sortBy, $allowedSortFields)) {
        $sortBy = 'MaND';
    }
    
    if (!in_array($sortOrder, $allowedSortOrders)) {
        $sortOrder = 'ASC';
    }
    
    $sql = "SELECT 
        MaND, TenDN, HoTen, SoDT, ThanhPho, NgaySinh,
        Email, MatKhau, QuyenHan, Avatar, NgayTao
    FROM NguoiDung ORDER BY $sortBy $sortOrder";

    $result = $conn->query($sql);
    
    if (!$result) {
        throw new Exception("Lỗi truy vấn: " . $conn->error);
    }

    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    echo json_encode([
        'data' => $data,
        'sort_info' => [
            'sort_by' => $sortBy,
            'sort_order' => $sortOrder
        ]
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>