<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $maPhim = $_POST['MaPhim'] ?? '';
    $trangThai = $_POST['TrangThai'] ?? '';

    if (empty($maPhim) || empty($trangThai)) {
        echo json_encode(['success' => false, 'error' => 'Thiếu thông tin mã phim hoặc trạng thái']);
        exit;
    }

    // Kiểm tra trạng thái hợp lệ
    $validStatuses = ['Phim đang chiếu', 'Phim sắp chiếu', 'Phim đã chiếu'];
    if (!in_array($trangThai, $validStatuses)) {
        echo json_encode(['success' => false, 'error' => 'Trạng thái không hợp lệ']);
        exit;
    }

    // Cập nhật trạng thái phim
    $stmt = $pdo->prepare("UPDATE phim SET TrangThai = ? WHERE MaPhim = ?");
    $result = $stmt->execute([$trangThai, $maPhim]);

    if ($result) {
        echo json_encode([
            'success' => true, 
            'message' => 'Cập nhật trạng thái phim thành công',
            'data' => [
                'MaPhim' => $maPhim,
                'TrangThai' => $trangThai
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Không thể cập nhật trạng thái phim']);
    }

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Lỗi cơ sở dữ liệu']);
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Lỗi hệ thống']);
}
?>