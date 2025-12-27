<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

try {
    // Lấy MaPhong từ GET parameter
    if (!isset($_GET['MaPhong']) || empty($_GET['MaPhong'])) {
        throw new Exception("Mã phòng chiếu là bắt buộc");
    }

    $maPhong = $_GET['MaPhong'];

    // Truy vấn thông tin phòng chiếu
    $sql = "SELECT MaPhong, TenPhong, LoaiPhong, SoLuongGhe FROM PhongChieu WHERE MaPhong = ?";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Lỗi chuẩn bị câu lệnh: " . $conn->error);
    }

    $stmt->bind_param("s", $maPhong);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception("Không tìm thấy phòng chiếu với mã: " . $maPhong);
    }

    $roomData = $result->fetch_assoc();

    // Lấy thông tin ghế trong phòng (nếu cần)
    $seatSql = "SELECT COUNT(*) as totalSeats, 
                       SUM(CASE WHEN LoaiGhe = 'Thường' THEN 1 ELSE 0 END) as thuongSeats,
                       SUM(CASE WHEN LoaiGhe = 'VIP' THEN 1 ELSE 0 END) as vipSeats,
                       SUM(CASE WHEN LoaiGhe = 'Đôi' THEN 1 ELSE 0 END) as doubleSeats
                FROM Ghe WHERE MaPhong = ?";
    $seatStmt = $conn->prepare($seatSql);
    $seatStmt->bind_param("s", $maPhong);
    $seatStmt->execute();
    $seatResult = $seatStmt->get_result();
    $seatInfo = $seatResult->fetch_assoc();

    // Kết hợp thông tin
    $roomData['seatInfo'] = $seatInfo;

    echo json_encode([
        'success' => true,
        'data' => $roomData
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>