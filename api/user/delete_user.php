<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Chỉ chấp nhận POST request'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    $mand = $input['MaND'] ?? '';
    
    if (empty($mand)) {
        throw new Exception('Vui lòng cung cấp Mã người dùng');
    }
    
    $checkSql = "SELECT COUNT(*) as count FROM NguoiDung WHERE MaND = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("s", $mand);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    $row = $result->fetch_assoc();
    
    if ($row['count'] == 0) {
        throw new Exception('Không tìm thấy người dùng với mã: ' . $mand);
    }
    
    $sql = "DELETE FROM NguoiDung WHERE MaND = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $mand);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Xóa người dùng thành công'], JSON_UNESCAPED_UNICODE);
    } else {
        throw new Exception('Lỗi khi xóa người dùng: ' . $stmt->error);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>