<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['MaUD'])) {
        throw new Exception("Mã ưu đãi là bắt buộc");
    }

    $maUD = $input['MaUD'];

    $checkSql = "SELECT MaUD, Anh FROM UuDai WHERE MaUD = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("s", $maUD);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception("Không tìm thấy ưu đãi với mã: " . $maUD);
    }

    $offer = $result->fetch_assoc();
    $imagePath = $offer['Anh'];

    $sql = "DELETE FROM UuDai WHERE MaUD = ?";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Lỗi chuẩn bị câu lệnh: " . $conn->error);
    }

    $stmt->bind_param("s", $maUD);

    if (!$stmt->execute()) {
        throw new Exception("Lỗi thực thi câu lệnh: " . $stmt->error);
    }

    if ($stmt->affected_rows === 0) {
        throw new Exception("Không có bản ghi nào được xóa");
    }

    if (!empty($imagePath)) {
        $fullImagePath = "../../public/" . $imagePath;
        if (file_exists($fullImagePath)) {
            unlink($fullImagePath);
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Xóa ưu đãi thành công'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>