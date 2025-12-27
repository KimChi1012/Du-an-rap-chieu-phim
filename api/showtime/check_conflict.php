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
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception("Dữ liệu đầu vào không hợp lệ");
    }
    
    $roomId = $input['roomId'];
    $date = $input['date'];
    $startTime = $input['startTime'];
    $duration = $input['duration']; // Thời lượng phim (phút)
    
    // Tính thời gian kết thúc (thêm 30 phút buffer)
    $startDateTime = new DateTime("$date $startTime");
    $endDateTime = clone $startDateTime;
    $endDateTime->add(new DateInterval("PT" . ($duration + 30) . "M"));
    
    $endTime = $endDateTime->format('H:i:s');
    
    // Kiểm tra xung đột với các suất chiếu khác
    $conflictQuery = "
        SELECT s.*, p.TenPhim, p.ThoiLuong
        FROM SuatChieu s
        JOIN Phim p ON s.MaPhim = p.MaPhim
        WHERE s.MaPhong = ? 
        AND s.NgayChieu = ? 
        AND (
            -- Suất chiếu mới bắt đầu trong khoảng thời gian của suất chiếu hiện có
            (s.GioBatDau <= ? AND s.GioKetThuc > ?) OR
            -- Suất chiếu hiện có bắt đầu trong khoảng thời gian của suất chiếu mới
            (s.GioBatDau < ? AND s.GioBatDau >= ?)
        )
    ";
    
    $conflictStmt = mysqli_prepare($conn, $conflictQuery);
    mysqli_stmt_bind_param($conflictStmt, "ssssss", $roomId, $date, $startTime, $startTime, $endTime, $startTime);
    mysqli_stmt_execute($conflictStmt);
    $conflictResult = mysqli_stmt_get_result($conflictStmt);
    
    $conflicts = [];
    while ($conflict = mysqli_fetch_assoc($conflictResult)) {
        $conflicts[] = [
            'MaSuat' => $conflict['MaSuat'],
            'TenPhim' => $conflict['TenPhim'],
            'GioBatDau' => $conflict['GioBatDau'],
            'GioKetThuc' => $conflict['GioKetThuc'],
            'ThoiLuong' => $conflict['ThoiLuong']
        ];
    }
    
    $hasConflict = count($conflicts) > 0;
    
    echo json_encode([
        "success" => true,
        "hasConflict" => $hasConflict,
        "conflicts" => $conflicts,
        "requestedTime" => [
            "start" => $startTime,
            "end" => $endTime,
            "date" => $date,
            "room" => $roomId
        ],
        "timestamp" => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage(),
        "timestamp" => date('Y-m-d H:i:s')
    ]);
}

mysqli_close($conn);
?>