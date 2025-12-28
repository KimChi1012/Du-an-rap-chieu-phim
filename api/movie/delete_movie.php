<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

try {
    // Lấy dữ liệu JSON từ request
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['MaPhim'])) {
        throw new Exception("Mã phim là bắt buộc");
    }

    $maPhim = $input['MaPhim'];

    // Lấy thông tin ảnh trước khi xóa
    $checkSql = "SELECT MaPhim, Poster, Banner FROM Phim WHERE MaPhim = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("s", $maPhim);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception("Không tìm thấy phim với mã: " . $maPhim);
    }

    $movie = $result->fetch_assoc();
    $posterPath = $movie['Poster'];
    $bannerPath = $movie['Banner'];

    // Xóa bản ghi trong database
    $sql = "DELETE FROM Phim WHERE MaPhim = ?";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Lỗi chuẩn bị câu lệnh: " . $conn->error);
    }

    $stmt->bind_param("s", $maPhim);

    if (!$stmt->execute()) {
        throw new Exception("Lỗi thực thi câu lệnh: " . $stmt->error);
    }

    if ($stmt->affected_rows === 0) {
        throw new Exception("Không có bản ghi nào được xóa");
    }

    // Xóa file ảnh sau khi xóa thành công trong database
    if ($posterPath && file_exists("../../public/" . $posterPath)) {
        unlink("../../public/" . $posterPath);
    }
    
    if ($bannerPath && file_exists("../../public/" . $bannerPath)) {
        unlink("../../public/" . $bannerPath);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Xóa phim thành công'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>