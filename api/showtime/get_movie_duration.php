<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../db.php';

try {
    $maPhim = $_GET['MaPhim'] ?? '';
    
    if (empty($maPhim)) {
        throw new Exception("Mã phim không được để trống");
    }

    // Lấy thông tin phim
    $query = "SELECT MaPhim, TenPhim, ThoiLuong FROM Phim WHERE MaPhim = ?";
    $stmt = mysqli_prepare($conn, $query);
    mysqli_stmt_bind_param($stmt, "s", $maPhim);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    
    if ($movie = mysqli_fetch_assoc($result)) {
        echo json_encode([
            'success' => true,
            'MaPhim' => $movie['MaPhim'],
            'TenPhim' => $movie['TenPhim'],
            'ThoiLuong' => (int)$movie['ThoiLuong'],
            'message' => "Phim: {$movie['TenPhim']} - Thời lượng: {$movie['ThoiLuong']} phút"
        ], JSON_UNESCAPED_UNICODE);
    } else {
        throw new Exception("Không tìm thấy phim với mã: $maPhim");
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

mysqli_close($conn);
?>