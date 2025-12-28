<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

try {
    // Lấy dữ liệu JSON từ request
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['MaDV'])) {
        throw new Exception("Mã dịch vụ là bắt buộc");
    }

    $maDV = $input['MaDV'];
    
    // Get image path before deleting the record
    $checkSql = "SELECT Anh FROM dichvu WHERE MaDV = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("s", $maDV);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception("Không tìm thấy dịch vụ với mã: " . $maDV);
    }
    
    $serviceData = $result->fetch_assoc();
    $imagePath = $serviceData['Anh'];

    // Delete the database record first
    $sql = "DELETE FROM dichvu WHERE MaDV = ?";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Lỗi chuẩn bị câu lệnh: " . $conn->error);
    }

    $stmt->bind_param("s", $maDV);

    if (!$stmt->execute()) {
        throw new Exception("Lỗi thực thi câu lệnh: " . $stmt->error);
    }

    if ($stmt->affected_rows === 0) {
        throw new Exception("Không có bản ghi nào được xóa");
    }
    
    // Delete the image file if it exists and is not the default image
    if ($imagePath && $imagePath !== 'images/default-service.svg') {
        $fullImagePath = "../../public/" . $imagePath;
        if (file_exists($fullImagePath)) {
            // Additional safety check - make sure we're only deleting files in the images directory
            $realPath = realpath($fullImagePath);
            $imagesDir = realpath("../../public/images/");
            
            if ($realPath && $imagesDir && strpos($realPath, $imagesDir) === 0) {
                if (unlink($fullImagePath)) {
                    error_log("Successfully deleted image file: " . $fullImagePath);
                } else {
                    error_log("Failed to delete image file: " . $fullImagePath);
                    // Don't throw exception here as the database record is already deleted
                }
            } else {
                error_log("Security check failed - attempted to delete file outside images directory: " . $fullImagePath);
            }
        } else {
            error_log("Image file not found: " . $fullImagePath);
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Xóa dịch vụ và ảnh thành công'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>