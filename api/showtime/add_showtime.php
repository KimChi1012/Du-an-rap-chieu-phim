<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../db.php';

try {
    // Lấy dữ liệu JSON từ request
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception("Dữ liệu không hợp lệ hoặc không phải JSON");
    }

    // Log dữ liệu nhận được để debug
    error_log("Received data: " . print_r($input, true));

    $MaPhim = trim($input['MaPhim'] ?? '');
    $MaPhong = trim($input['MaPhong'] ?? '');
    $NgayChieu = trim($input['NgayChieu'] ?? '');
    $GioBatDau = trim($input['GioBatDau'] ?? '');

    // Validate dữ liệu bắt buộc (không cần GioKetThuc nữa)
    if (empty($MaPhim)) {
        throw new Exception("Mã phim không được để trống");
    }
    if (empty($MaPhong)) {
        throw new Exception("Mã phòng không được để trống");
    }
    if (empty($NgayChieu)) {
        throw new Exception("Ngày chiếu không được để trống");
    }
    if (empty($GioBatDau)) {
        throw new Exception("Giờ bắt đầu không được để trống");
    }

    // Validate format ngày
    if (!DateTime::createFromFormat('Y-m-d', $NgayChieu)) {
        throw new Exception("Định dạng ngày chiếu không hợp lệ (cần Y-m-d)");
    }

    // Validate format giờ
    if (!DateTime::createFromFormat('H:i', $GioBatDau) && !DateTime::createFromFormat('H:i:s', $GioBatDau)) {
        throw new Exception("Định dạng giờ bắt đầu không hợp lệ (cần H:i hoặc H:i:s)");
    }

    // Chuẩn hóa format giờ bắt đầu
    if (strlen($GioBatDau) == 5) { // Format H:i
        $GioBatDau .= ':00'; // Thêm giây
    }
    
    // Lấy thời lượng phim từ database
    $movieQuery = "SELECT ThoiLuong FROM Phim WHERE MaPhim = ?";
    $movieStmt = mysqli_prepare($conn, $movieQuery);
    if (!$movieStmt) {
        throw new Exception("Lỗi chuẩn bị truy vấn phim: " . mysqli_error($conn));
    }
    
    mysqli_stmt_bind_param($movieStmt, "s", $MaPhim);
    mysqli_stmt_execute($movieStmt);
    $movieResult = mysqli_stmt_get_result($movieStmt);
    $movie = mysqli_fetch_assoc($movieResult);
    
    if (!$movie) {
        throw new Exception("Không tìm thấy phim với mã: $MaPhim");
    }
    
    $duration = (int)$movie['ThoiLuong']; // Thời lượng phim (phút)
    
    if ($duration <= 0) {
        throw new Exception("Thời lượng phim không hợp lệ: $duration phút");
    }
    
    // Tính giờ kết thúc = giờ bắt đầu + thời lượng phim
    try {
        $startDateTime = new DateTime("$NgayChieu $GioBatDau");
        $endDateTime = clone $startDateTime;
        $endDateTime->add(new DateInterval("PT{$duration}M"));
        $GioKetThuc = $endDateTime->format('H:i:s');
    } catch (Exception $e) {
        throw new Exception("Lỗi tính toán thời gian: " . $e->getMessage());
    }

    // Tạo mã suất chiếu tự động
    $query = "SELECT MaSuat FROM SuatChieu ORDER BY MaSuat DESC LIMIT 1";
    $result = mysqli_query($conn, $query);
    
    if ($row = mysqli_fetch_assoc($result)) {
        $lastMaSuat = $row['MaSuat'];
        $number = intval(substr($lastMaSuat, 4)) + 1;
    } else {
        $number = 1;
    }
    
    $MaSuat = 'SUAT' . str_pad($number, 4, '0', STR_PAD_LEFT);

    // Kiểm tra xung đột lịch chiếu
    $conflictQuery = "
        SELECT COUNT(*) as count 
        FROM SuatChieu 
        WHERE MaPhong = ? 
        AND NgayChieu = ? 
        AND (
            (GioBatDau <= ? AND GioKetThuc > ?) OR
            (GioBatDau < ? AND GioBatDau >= ?)
        )
    ";
    
    $conflictStmt = mysqli_prepare($conn, $conflictQuery);
    mysqli_stmt_bind_param($conflictStmt, "ssssss", $MaPhong, $NgayChieu, $GioBatDau, $GioBatDau, $GioKetThuc, $GioBatDau);
    mysqli_stmt_execute($conflictStmt);
    $conflictResult = mysqli_stmt_get_result($conflictStmt);
    $conflict = mysqli_fetch_assoc($conflictResult);
    
    if ($conflict['count'] > 0) {
        throw new Exception("Lịch chiếu bị trùng với suất chiếu khác trong cùng phòng");
    }

    // Thêm suất chiếu mới
    $sql = "INSERT INTO SuatChieu (MaSuat, MaPhim, MaPhong, NgayChieu, GioBatDau, GioKetThuc) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = mysqli_prepare($conn, $sql);
    mysqli_stmt_bind_param($stmt, "ssssss", $MaSuat, $MaPhim, $MaPhong, $NgayChieu, $GioBatDau, $GioKetThuc);
        
    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception("Lỗi thêm suất chiếu: " . mysqli_error($conn));
    }

    echo json_encode([
        'success' => true,
        'message' => 'Thêm suất chiếu thành công',
        'MaSuat' => $MaSuat,
        'GioKetThuc' => $GioKetThuc,
        'ThoiLuong' => $duration
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

mysqli_close($conn);
?>