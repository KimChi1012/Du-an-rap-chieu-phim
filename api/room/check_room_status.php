<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

try {
    // Lấy dữ liệu từ GET hoặc POST
    $maPhong = $_GET['MaPhong'] ?? $_POST['MaPhong'] ?? '';
    
    if (empty($maPhong)) {
        throw new Exception("Mã phòng là bắt buộc");
    }

    // Kiểm tra phòng có tồn tại không
    $checkRoomSql = "SELECT * FROM PhongChieu WHERE MaPhong = ?";
    $checkStmt = $conn->prepare($checkRoomSql);
    $checkStmt->bind_param("s", $maPhong);
    $checkStmt->execute();
    $roomResult = $checkStmt->get_result();
    
    if ($roomResult->num_rows === 0) {
        throw new Exception("Không tìm thấy phòng với mã: " . $maPhong);
    }
    
    $room = $roomResult->fetch_assoc();

    // Đếm số ghế trong phòng
    $seatCountSql = "SELECT COUNT(*) as count FROM Ghe WHERE MaPhong = ?";
    $seatStmt = $conn->prepare($seatCountSql);
    $seatStmt->bind_param("s", $maPhong);
    $seatStmt->execute();
    $seatResult = $seatStmt->get_result();
    $seatCount = $seatResult->fetch_assoc()['count'];

    // Đếm số suất chiếu
    $showtimeCountSql = "SELECT COUNT(*) as count FROM SuatChieu WHERE MaPhong = ?";
    $showtimeStmt = $conn->prepare($showtimeCountSql);
    $showtimeStmt->bind_param("s", $maPhong);
    $showtimeStmt->execute();
    $showtimeResult = $showtimeStmt->get_result();
    $showtimeCount = $showtimeResult->fetch_assoc()['count'];

    // Đếm số ghế đã được đặt
    $bookedSeatsSql = "SELECT COUNT(*) as count FROM GheSuatChieu gsc 
                       INNER JOIN Ghe g ON gsc.MaGhe = g.MaGhe 
                       WHERE g.MaPhong = ? AND gsc.TrangThai = 'Đã đặt'";
    $bookedStmt = $conn->prepare($bookedSeatsSql);
    $bookedStmt->bind_param("s", $maPhong);
    $bookedStmt->execute();
    $bookedResult = $bookedStmt->get_result();
    $bookedSeats = $bookedResult->fetch_assoc()['count'];

    // Đếm số suất chiếu sắp tới (từ hôm nay trở đi)
    $upcomingShowtimesSql = "SELECT COUNT(*) as count FROM SuatChieu 
                            WHERE MaPhong = ? AND NgayChieu >= CURDATE()";
    $upcomingStmt = $conn->prepare($upcomingShowtimesSql);
    $upcomingStmt->bind_param("s", $maPhong);
    $upcomingStmt->execute();
    $upcomingResult = $upcomingStmt->get_result();
    $upcomingShowtimes = $upcomingResult->fetch_assoc()['count'];

    // Xác định trạng thái có thể thực hiện các thao tác
    $canUpdate = $bookedSeats == 0; // Có thể sửa nếu không có ghế nào được đặt
    $canDelete = $bookedSeats == 0 && $showtimeCount == 0; // Có thể xóa nếu không có ghế đặt và suất chiếu
    $canChangeSeats = $bookedSeats == 0; // Có thể thay đổi số ghế nếu không có ghế nào được đặt

    echo json_encode([
        'success' => true,
        'data' => [
            'room' => $room,
            'statistics' => [
                'totalSeats' => $seatCount,
                'totalShowtimes' => $showtimeCount,
                'bookedSeats' => $bookedSeats,
                'upcomingShowtimes' => $upcomingShowtimes
            ],
            'permissions' => [
                'canUpdate' => $canUpdate,
                'canDelete' => $canDelete,
                'canChangeSeats' => $canChangeSeats
            ],
            'warnings' => [
                'hasBookedSeats' => $bookedSeats > 0,
                'hasShowtimes' => $showtimeCount > 0,
                'hasUpcomingShowtimes' => $upcomingShowtimes > 0
            ]
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>