<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Chỉ chấp nhận POST request'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // ===== 1. Nhận dữ liệu JSON =====
    $input = json_decode(file_get_contents('php://input'), true);
    $maqc = $input['MaQC'] ?? '';

    if (empty($maqc)) {
        throw new Exception('Vui lòng cung cấp Mã quảng cáo');
    }

    // ===== 2. Kiểm tra banner tồn tại + lấy đường dẫn ảnh =====
    $checkSql = "SELECT Banner FROM quangcao WHERE MaQC = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("s", $maqc);
    $checkStmt->execute();
    $result = $checkStmt->get_result();

    if ($result->num_rows === 0) {
        throw new Exception('Không tìm thấy banner với mã: ' . $maqc);
    }

    $row = $result->fetch_assoc();
    $bannerPath = $row['Banner']; // uploads/banners/xxx.jpg

    // ===== 3. Xóa banner trong CSDL =====
    $sql = "DELETE FROM quangcao WHERE MaQC = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $maqc);

    if ($stmt->execute()) {

        // ===== 4. Xóa file ảnh trên server (nếu có) =====
        if (!empty($bannerPath)) {
            // Đường dẫn đầy đủ đến file ảnh
            $fullPath = dirname(__DIR__, 2) . "/public/" . $bannerPath;
            
            // Debug log
            error_log("Attempting to delete file: " . $fullPath);
            
            if (file_exists($fullPath)) {
                if (unlink($fullPath)) {
                    error_log("File deleted successfully: " . $fullPath);
                } else {
                    error_log("Failed to delete file: " . $fullPath);
                }
            } else {
                error_log("File not found: " . $fullPath);
            }
        }

        echo json_encode([
            'success' => true,
            'message' => 'Xóa banner thành công'
        ], JSON_UNESCAPED_UNICODE);

    } else {
        throw new Exception('Lỗi khi xóa banner: ' . $stmt->error);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
