<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

try {
    // Tìm mã phim lớn nhất có format PH + 3 số
    $sql = "SELECT MaPhim FROM Phim WHERE MaPhim REGEXP '^PH[0-9]{3}$' ORDER BY MaPhim DESC LIMIT 1";
    $result = $conn->query($sql);
    
    if ($result && $result->num_rows > 0) {
        $lastCode = $result->fetch_assoc()['MaPhim'];
        // Lấy số từ mã cuối cùng (ví dụ: PH001 -> 001)
        $lastNumber = (int)substr($lastCode, 2); // Bỏ 2 ký tự đầu (PH)
        $nextNumber = $lastNumber + 1;
    } else {
        // Nếu chưa có phim nào, bắt đầu từ 001
        $nextNumber = 1;
    }
    
    // Tạo mã phim mới với 3 chữ số
    $newMovieCode = 'PH' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
    
    // Kiểm tra xem mã đã tồn tại chưa (để đảm bảo không trùng)
    $checkSql = "SELECT COUNT(*) as count FROM Phim WHERE MaPhim = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("s", $newMovieCode);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    $count = $checkResult->fetch_assoc()['count'];
    
    // Nếu mã đã tồn tại, tìm mã tiếp theo
    while ($count > 0) {
        $nextNumber++;
        $newMovieCode = 'PH' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
        $checkStmt->bind_param("s", $newMovieCode);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        $count = $checkResult->fetch_assoc()['count'];
    }
    
    echo json_encode([
        'success' => true,
        'movieCode' => $newMovieCode,
        'sequence' => $nextNumber
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>