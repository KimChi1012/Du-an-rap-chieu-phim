<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

try {
    // Lấy dữ liệu JSON từ request
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['MaSuat'])) {
        throw new Exception("Mã suất chiếu là bắt buộc");
    }

    $maSuat = $input['MaSuat'];
    
    // Check if record exists
    $checkSql = "SELECT MaSuat FROM SuatChieu WHERE MaSuat = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("s", $maSuat);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception("Không tìm thấy suất chiếu với mã: " . $maSuat);
    }

    // ✅ KIỂM TRA GHẾ ĐÃ ĐƯỢC ĐẶT
    $checkBookedSql = "SELECT COUNT(*) as count FROM GheSuatChieu WHERE MaSuat = ? AND TrangThai = 'Đã đặt'";
    $checkBookedStmt = $conn->prepare($checkBookedSql);
    $checkBookedStmt->bind_param("s", $maSuat);
    $checkBookedStmt->execute();
    $bookedResult = $checkBookedStmt->get_result();
    $bookedCount = $bookedResult->fetch_assoc()['count'];
    
    if ($bookedCount > 0) {
        throw new Exception("Không thể xóa suất chiếu vì có $bookedCount ghế đã được đặt");
    }

    // ✅ BẮT ĐẦU TRANSACTION
    $conn->begin_transaction();

    try {
        // ✅ XÓA TẤT CẢ GHẾ SUẤT CHIẾU TRƯỚC
        $deleteSeatShowtimesSql = "DELETE FROM GheSuatChieu WHERE MaSuat = ?";
        $deleteSeatStmt = $conn->prepare($deleteSeatShowtimesSql);
        $deleteSeatStmt->bind_param("s", $maSuat);
        $deleteSeatStmt->execute();
        $deletedSeatShowtimes = $deleteSeatStmt->affected_rows;

        // ✅ XÓA SUẤT CHIẾU
        $sql = "DELETE FROM SuatChieu WHERE MaSuat = ?";
        $stmt = $conn->prepare($sql);
        
        if (!$stmt) {
            throw new Exception("Lỗi chuẩn bị câu lệnh: " . $conn->error);
        }

        $stmt->bind_param("s", $maSuat);

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
            'message' => "Xóa suất chiếu thành công và xóa $deletedSeatShowtimes ghế suất chiếu",
            'data' => [
                'MaSuat' => $maSuat,
                'DeletedSeatShowtimes' => $deletedSeatShowtimes
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