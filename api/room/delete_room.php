<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

// ✅ HÀM KIỂM TRA GHẾ ĐÃ ĐƯỢC ĐẶT
function hasBookedSeats($conn, $maPhong) {
    $checkBookedSql = "SELECT COUNT(*) as count FROM ghesuatchieu gsc 
                       INNER JOIN ghe g ON gsc.MaGhe = g.MaGhe 
                       WHERE g.MaPhong = ? AND gsc.TrangThai = 'Đã đặt'";
    $checkStmt = $conn->prepare($checkBookedSql);
    $checkStmt->bind_param("s", $maPhong);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    $count = $result->fetch_assoc()['count'];
    
    return $count > 0;
}

// ✅ HÀM KIỂM TRA SUẤT CHIẾU
function hasShowtimes($conn, $maPhong) {
    $checkShowtimesSql = "SELECT COUNT(*) as count FROM suatchieu WHERE MaPhong = ?";
    $checkStmt = $conn->prepare($checkShowtimesSql);
    $checkStmt->bind_param("s", $maPhong);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    $count = $result->fetch_assoc()['count'];
    
    return $count > 0;
}

try {
    // Lấy dữ liệu từ POST hoặc JSON
    $input = $_POST;
    
    // Nếu không có POST data, thử lấy từ JSON
    if (empty($input)) {
        $json = file_get_contents('php://input');
        $input = json_decode($json, true);
    }

    if (!$input || !isset($input['MaPhong'])) {
        throw new Exception("Mã phòng chiếu là bắt buộc");
    }

    $maPhong = $input['MaPhong'];

    // Check if record exists
    $checkSql = "SELECT MaPhong FROM PhongChieu WHERE MaPhong = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("s", $maPhong);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception("Không tìm thấy phòng chiếu với mã: " . $maPhong);
    }

    // ✅ KIỂM TRA GHẾ ĐÃ ĐƯỢC ĐẶT
    if (hasBookedSeats($conn, $maPhong)) {
        throw new Exception("Không thể xóa phòng chiếu vì có ghế đã được đặt. Vui lòng chờ sau khi các suất chiếu kết thúc.");
    }

    // ✅ KIỂM TRA SUẤT CHIẾU
    if (hasShowtimes($conn, $maPhong)) {
        throw new Exception("Không thể xóa phòng chiếu vì còn có suất chiếu. Vui lòng xóa tất cả suất chiếu trước.");
    }

    // ✅ BẮT ĐẦU TRANSACTION
    $conn->begin_transaction();

    try {
        // ✅ XÓA TẤT CẢ GHẾ TRONG PHÒNG TRƯỚC
        $deleteSeatsSQL = "DELETE FROM Ghe WHERE MaPhong = ?";
        $deleteSeatsStmt = $conn->prepare($deleteSeatsSQL);
        $deleteSeatsStmt->bind_param("s", $maPhong);
        $deleteSeatsStmt->execute();
        $deletedSeats = $deleteSeatsStmt->affected_rows;

        // ✅ XÓA PHÒNG CHIẾU
        $sql = "DELETE FROM PhongChieu WHERE MaPhong = ?";
        $stmt = $conn->prepare($sql);
        
        if (!$stmt) {
            throw new Exception("Lỗi chuẩn bị câu lệnh: " . $conn->error);
        }

        $stmt->bind_param("s", $maPhong);

        if (!$stmt->execute()) {
            throw new Exception("Lỗi thực thi câu lệnh: " . $stmt->error);
        }

        if ($stmt->affected_rows === 0) {
            throw new Exception("Không có bản ghi nào được xóa");
        }

        // ✅ COMMIT TRANSACTION
        $conn->commit();
        
        echo json_encode([
            'success' => true,
            'message' => "Xóa phòng chiếu thành công. Đã xóa $deletedSeats ghế.",
            'data' => [
                'MaPhong' => $maPhong,
                'DeletedSeats' => $deletedSeats
            ]
        ], JSON_UNESCAPED_UNICODE);

    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>