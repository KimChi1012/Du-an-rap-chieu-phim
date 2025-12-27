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
    error_log("Update showtime received data: " . print_r($input, true));

    $MaSuat = trim($input['MaSuat'] ?? '');
    $MaPhim = trim($input['MaPhim'] ?? '');
    $MaPhong = trim($input['MaPhong'] ?? '');
    $NgayChieu = trim($input['NgayChieu'] ?? '');
    $GioBatDau = trim($input['GioBatDau'] ?? '');

    // Validate dữ liệu bắt buộc
    if (empty($MaSuat)) {
        throw new Exception("Mã suất chiếu không được để trống");
    }
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

    // Check if record exists
    $checkSql = "SELECT MaSuat FROM SuatChieu WHERE MaSuat = ?";
    $checkStmt = mysqli_prepare($conn, $checkSql);
    if (!$checkStmt) {
        throw new Exception("Lỗi chuẩn bị truy vấn kiểm tra: " . mysqli_error($conn));
    }
    
    mysqli_stmt_bind_param($checkStmt, "s", $MaSuat);
    mysqli_stmt_execute($checkStmt);
    $result = mysqli_stmt_get_result($checkStmt);
    
    if (mysqli_num_rows($result) === 0) {
        throw new Exception("Không tìm thấy suất chiếu với mã: $MaSuat");
    }

    // Kiểm tra xung đột lịch chiếu (trừ chính nó)
    $conflictQuery = "
        SELECT COUNT(*) as count 
        FROM SuatChieu 
        WHERE MaPhong = ? 
        AND NgayChieu = ? 
        AND MaSuat != ?
        AND (
            (GioBatDau <= ? AND GioKetThuc > ?) OR
            (GioBatDau < ? AND GioBatDau >= ?)
        )
    ";
    
    $conflictStmt = mysqli_prepare($conn, $conflictQuery);
    if (!$conflictStmt) {
        throw new Exception("Lỗi chuẩn bị truy vấn xung đột: " . mysqli_error($conn));
    }
    
    mysqli_stmt_bind_param($conflictStmt, "sssssss", 
        $MaPhong, 
        $NgayChieu, 
        $MaSuat,
        $GioBatDau, 
        $GioBatDau, 
        $GioKetThuc, 
        $GioBatDau
    );
    mysqli_stmt_execute($conflictStmt);
    $conflictResult = mysqli_stmt_get_result($conflictStmt);
    $conflict = mysqli_fetch_assoc($conflictResult);
    
    if ($conflict['count'] > 0) {
        throw new Exception("Lịch chiếu bị trùng với suất chiếu khác trong cùng phòng");
    }

    // Prepare SQL statement
    $sql = "UPDATE SuatChieu SET MaPhim = ?, MaPhong = ?, NgayChieu = ?, GioBatDau = ?, GioKetThuc = ? WHERE MaSuat = ?";
    $stmt = mysqli_prepare($conn, $sql);
    
    if (!$stmt) {
        throw new Exception("Lỗi chuẩn bị câu lệnh: " . mysqli_error($conn));
    }

    mysqli_stmt_bind_param($stmt, "ssssss", 
        $MaPhim, 
        $MaPhong, 
        $NgayChieu, 
        $GioBatDau, 
        $GioKetThuc, 
        $MaSuat
    );

    if (!mysqli_stmt_execute($stmt)) {
        throw new Exception("Lỗi thực thi câu lệnh: " . mysqli_stmt_error($stmt));
    }

    if (mysqli_stmt_affected_rows($stmt) === 0) {
        throw new Exception("Không có thay đổi nào được thực hiện hoặc dữ liệu không thay đổi");
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Cập nhật suất chiếu thành công',
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