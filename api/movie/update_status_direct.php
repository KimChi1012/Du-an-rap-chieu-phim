<?php
// API cập nhật trạng thái phim - trả về JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'db.php';

try {
    // Lấy tất cả phim
    $query = "SELECT MaPhim, TenPhim, NgayKhoiChieu, TrangThai FROM phim ORDER BY NgayKhoiChieu DESC";
    $result = mysqli_query($conn, $query);
    
    if (!$result) {
        throw new Exception("Lỗi truy vấn: " . mysqli_error($conn));
    }
    
    $movies = mysqli_fetch_all($result, MYSQLI_ASSOC);
    
    $today = new DateTime();
    $today->setTime(0, 0, 0);
    
    $twoMonthsAgo = clone $today;
    $twoMonthsAgo->modify('-2 months');
    
    $updatedCount = 0;
    $updates = [];
    
    foreach ($movies as $movie) {
        if (empty($movie['NgayKhoiChieu'])) {
            continue;
        }
        
        $releaseDate = new DateTime($movie['NgayKhoiChieu']);
        $releaseDate->setTime(0, 0, 0);
        
        $newStatus = $movie['TrangThai'];
        $oldStatus = $movie['TrangThai'];
        
        // Logic cập nhật trạng thái
        if ($releaseDate > $today) {
            $newStatus = 'Phim sắp chiếu';
        } elseif ($releaseDate <= $today && $releaseDate >= $twoMonthsAgo) {
            $newStatus = 'Phim đang chiếu';
        } elseif ($releaseDate < $twoMonthsAgo) {
            $newStatus = 'Phim đã chiếu';
        }
        
        // Nếu trạng thái thay đổi
        if ($newStatus !== $oldStatus) {
            // Cập nhật database
            $updateQuery = "UPDATE phim SET TrangThai = ? WHERE MaPhim = ?";
            $stmt = mysqli_prepare($conn, $updateQuery);
            mysqli_stmt_bind_param($stmt, "ss", $newStatus, $movie['MaPhim']);
            $updateResult = mysqli_stmt_execute($stmt);
            
            if ($updateResult) {
                $updates[] = [
                    'MaPhim' => $movie['MaPhim'],
                    'TenPhim' => $movie['TenPhim'],
                    'TrangThaiCu' => $oldStatus,
                    'TrangThaiMoi' => $newStatus
                ];
                $updatedCount++;
            }
            
            mysqli_stmt_close($stmt);
        }
    }
    
    mysqli_close($conn);
    
    // Trả về kết quả JSON
    echo json_encode([
        'success' => true,
        'message' => $updatedCount > 0 ? "Đã cập nhật {$updatedCount} phim thành công!" : "Không có phim nào cần cập nhật",
        'data' => [
            'totalMovies' => count($movies),
            'updatedCount' => $updatedCount,
            'updates' => $updates,
            'today' => $today->format('Y-m-d'),
            'twoMonthsAgo' => $twoMonthsAgo->format('Y-m-d')
        ]
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>