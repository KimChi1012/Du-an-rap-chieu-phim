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

    // Prepare SQL statement
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
    
    echo json_encode([
        'success' => true,
        'message' => 'Xóa suất chiếu thành công'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>