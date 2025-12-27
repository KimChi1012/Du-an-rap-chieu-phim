<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../db.php';

function generateShowtimesWithDistribution($conn, $movieId, $startDate, $endDate, $roomId, $movieIndex, $roomIndex) {
    // Khung giờ chiếu của rạp (chỉ 3 khung giờ)
    $timeSlots = ['09:00:00', '14:00:00', '19:00:00'];
    $generatedCount = 0;
    
    // Lấy thông tin phim để biết thời lượng
    $movieQuery = "SELECT ThoiLuong FROM Phim WHERE MaPhim = ?";
    $movieStmt = mysqli_prepare($conn, $movieQuery);
    mysqli_stmt_bind_param($movieStmt, "s", $movieId);
    mysqli_stmt_execute($movieStmt);
    $movieResult = mysqli_stmt_get_result($movieStmt);
    $movie = mysqli_fetch_assoc($movieResult);
    
    if (!$movie) {
        return 0;
    }
    
    $duration = $movie['ThoiLuong']; // Thời lượng phim (phút)
    
    // Tạo suất chiếu cho từng ngày
    $currentDate = new DateTime($startDate);
    $endDateTime = new DateTime($endDate);
    
    while ($currentDate <= $endDateTime) {
        $dateStr = $currentDate->format('Y-m-d');
        
        // Phân bổ thông minh: mỗi phim ưu tiên khung giờ khác nhau để tránh trùng lặp
        $prioritizedSlots = [];
        for ($i = 0; $i < count($timeSlots); $i++) {
            $slotIndex = ($movieIndex + $i) % count($timeSlots);
            $prioritizedSlots[] = $timeSlots[$slotIndex];
        }
        
        foreach ($prioritizedSlots as $timeSlot) {
            // Tính giờ kết thúc
            $startTime = new DateTime("$dateStr $timeSlot");
            $endTime = clone $startTime;
            $endTime->add(new DateInterval("PT{$duration}M"));
            $endTimeStr = $endTime->format('H:i:s');
            
            // Kiểm tra xem suất chiếu này đã tồn tại chưa (cùng phim, cùng phòng, cùng ngày, cùng giờ)
            $checkQuery = "SELECT COUNT(*) as count FROM SuatChieu 
                          WHERE MaPhim = ? AND MaPhong = ? AND NgayChieu = ? AND GioBatDau = ?";
            $checkStmt = mysqli_prepare($conn, $checkQuery);
            mysqli_stmt_bind_param($checkStmt, "ssss", $movieId, $roomId, $dateStr, $timeSlot);
            mysqli_stmt_execute($checkStmt);
            $checkResult = mysqli_stmt_get_result($checkStmt);
            $exists = mysqli_fetch_assoc($checkResult)['count'] > 0;
            
            if (!$exists) {
                // Kiểm tra xung đột lịch chiếu trong cùng phòng
                if (!hasScheduleConflict($conn, $roomId, $dateStr, $timeSlot, $duration)) {
                    // Kiểm tra trùng giờ cho cùng 1 phim (không được cùng phim cùng giờ trong cùng ngày)
                    if (!hasSameMovieTimeConflict($conn, $movieId, $dateStr, $timeSlot)) {
                        // Tạo mã suất chiếu tự động
                        $maSuat = generateMaSuat($conn);
                        
                        // Tạo suất chiếu mới
                        $insertQuery = "INSERT INTO SuatChieu (MaSuat, MaPhim, MaPhong, NgayChieu, GioBatDau, GioKetThuc) 
                                       VALUES (?, ?, ?, ?, ?, ?)";
                        $insertStmt = mysqli_prepare($conn, $insertQuery);
                        mysqli_stmt_bind_param($insertStmt, "ssssss", $maSuat, $movieId, $roomId, $dateStr, $timeSlot, $endTimeStr);
                        
                        if (mysqli_stmt_execute($insertStmt)) {
                            $generatedCount++;
                            // Chỉ tạo 1 suất chiếu cho mỗi phim mỗi ngày trong mỗi phòng để tránh trùng lặp
                            break;
                        }
                    }
                }
            }
        }
        
        $currentDate->add(new DateInterval('P1D'));
    }
    
    return $generatedCount;
}

function generateShowtimes($conn, $movieId, $startDate, $endDate, $roomId) {
    // Khung giờ chiếu của rạp (chỉ 3 khung giờ)
    $timeSlots = ['09:00:00', '14:00:00', '19:00:00'];
    $generatedCount = 0;
    
    // Lấy thông tin phim để biết thời lượng
    $movieQuery = "SELECT ThoiLuong FROM Phim WHERE MaPhim = ?";
    $movieStmt = mysqli_prepare($conn, $movieQuery);
    mysqli_stmt_bind_param($movieStmt, "s", $movieId);
    mysqli_stmt_execute($movieStmt);
    $movieResult = mysqli_stmt_get_result($movieStmt);
    $movie = mysqli_fetch_assoc($movieResult);
    
    if (!$movie) {
        throw new Exception("Không tìm thấy phim với ID: $movieId");
    }
    
    $duration = $movie['ThoiLuong']; // Thời lượng phim (phút)
    
    // Tạo suất chiếu cho từng ngày
    $currentDate = new DateTime($startDate);
    $endDateTime = new DateTime($endDate);
    
    while ($currentDate <= $endDateTime) {
        $dateStr = $currentDate->format('Y-m-d');
        
        foreach ($timeSlots as $timeSlot) {
            // Tính giờ kết thúc
            $startTime = new DateTime("$dateStr $timeSlot");
            $endTime = clone $startTime;
            $endTime->add(new DateInterval("PT{$duration}M"));
            $endTimeStr = $endTime->format('H:i:s');
            
            // Kiểm tra xem suất chiếu này đã tồn tại chưa (cùng phim, cùng phòng, cùng ngày, cùng giờ)
            $checkQuery = "SELECT COUNT(*) as count FROM SuatChieu 
                          WHERE MaPhim = ? AND MaPhong = ? AND NgayChieu = ? AND GioBatDau = ?";
            $checkStmt = mysqli_prepare($conn, $checkQuery);
            mysqli_stmt_bind_param($checkStmt, "ssss", $movieId, $roomId, $dateStr, $timeSlot);
            mysqli_stmt_execute($checkStmt);
            $checkResult = mysqli_stmt_get_result($checkStmt);
            $exists = mysqli_fetch_assoc($checkResult)['count'] > 0;
            
            if (!$exists) {
                // Kiểm tra xung đột lịch chiếu trong cùng phòng
                if (!hasScheduleConflict($conn, $roomId, $dateStr, $timeSlot, $duration)) {
                    // Kiểm tra trùng giờ cho cùng 1 phim (không được cùng phim cùng giờ trong cùng ngày)
                    if (!hasSameMovieTimeConflict($conn, $movieId, $dateStr, $timeSlot)) {
                        // Tạo mã suất chiếu tự động
                        $maSuat = generateMaSuat($conn);
                        
                        // Tạo suất chiếu mới
                        $insertQuery = "INSERT INTO SuatChieu (MaSuat, MaPhim, MaPhong, NgayChieu, GioBatDau, GioKetThuc) 
                                       VALUES (?, ?, ?, ?, ?, ?)";
                        $insertStmt = mysqli_prepare($conn, $insertQuery);
                        mysqli_stmt_bind_param($insertStmt, "ssssss", $maSuat, $movieId, $roomId, $dateStr, $timeSlot, $endTimeStr);
                        
                        if (mysqli_stmt_execute($insertStmt)) {
                            $generatedCount++;
                        }
                    }
                }
            }
        }
        
        $currentDate->add(new DateInterval('P1D'));
    }
    
    return $generatedCount;
}

function generateMaSuat($conn) {
    // Lấy số thứ tự cao nhất hiện tại
    $query = "SELECT MaSuat FROM SuatChieu ORDER BY MaSuat DESC LIMIT 1";
    $result = mysqli_query($conn, $query);
    
    if ($row = mysqli_fetch_assoc($result)) {
        $lastMaSuat = $row['MaSuat'];
        // Lấy phần số từ SUAT0001 -> 0001
        $number = intval(substr($lastMaSuat, 4)) + 1;
    } else {
        $number = 1;
    }
    
    return 'SUAT' . str_pad($number, 4, '0', STR_PAD_LEFT);
}

function hasScheduleConflict($conn, $roomId, $date, $startTime, $duration) {
    // Tính thời gian kết thúc (thêm 30 phút buffer để dọn dẹp phòng)
    $startDateTime = new DateTime("$date $startTime");
    $endDateTime = clone $startDateTime;
    $endDateTime->add(new DateInterval("PT" . ($duration + 30) . "M"));
    
    $endTime = $endDateTime->format('H:i:s');
    
    // Kiểm tra xung đột với các suất chiếu khác trong cùng phòng và ngày
    $conflictQuery = "
        SELECT COUNT(*) as count 
        FROM SuatChieu s
        JOIN Phim p ON s.MaPhim = p.MaPhim
        WHERE s.MaPhong = ? 
        AND s.NgayChieu = ? 
        AND (
            (s.GioBatDau <= ? AND s.GioKetThuc > ?) OR
            (s.GioBatDau < ? AND s.GioBatDau >= ?)
        )
    ";
    
    $conflictStmt = mysqli_prepare($conn, $conflictQuery);
    mysqli_stmt_bind_param($conflictStmt, "ssssss", $roomId, $date, $startTime, $startTime, $endTime, $startTime);
    mysqli_stmt_execute($conflictStmt);
    $conflictResult = mysqli_stmt_get_result($conflictStmt);
    $conflict = mysqli_fetch_assoc($conflictResult);
    
    return $conflict['count'] > 0;
}

function hasSameMovieTimeConflict($conn, $movieId, $date, $startTime) {
    // Kiểm tra xem cùng 1 phim đã có suất chiếu cùng giờ trong cùng ngày chưa
    $conflictQuery = "
        SELECT COUNT(*) as count 
        FROM SuatChieu 
        WHERE MaPhim = ? 
        AND NgayChieu = ? 
        AND GioBatDau = ?
    ";
    
    $conflictStmt = mysqli_prepare($conn, $conflictQuery);
    mysqli_stmt_bind_param($conflictStmt, "sss", $movieId, $date, $startTime);
    mysqli_stmt_execute($conflictStmt);
    $conflictResult = mysqli_stmt_get_result($conflictStmt);
    $conflict = mysqli_fetch_assoc($conflictResult);
    
    return $conflict['count'] > 0;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        // Nếu không có input, tạo suất chiếu cho phim đang chiếu và sắp chiếu
        $today = date('Y-m-d');
        $futureDate = date('Y-m-d', strtotime('+60 days')); // Xem xét phim trong 60 ngày tới
        
        // Lấy phim đang chiếu và sắp chiếu (trong vòng 60 ngày)
        $moviesQuery = "
            SELECT MaPhim, TenPhim, NgayKhoiChieu, ThoiLuong, TrangThai 
            FROM Phim 
            WHERE TrangThai IN ('Phim đang chiếu', 'Phim sắp chiếu')
            AND NgayKhoiChieu IS NOT NULL
            AND ThoiLuong > 0
            ORDER BY NgayKhoiChieu ASC
        ";
        
        $moviesResult = mysqli_query($conn, $moviesQuery);
        if (!$moviesResult) {
            throw new Exception("Lỗi truy vấn phim: " . mysqli_error($conn));
        }
        
        $totalGenerated = 0;
        $processedMovies = 0;
        
        // Lấy danh sách phòng chiếu từ database
        $roomsQuery = "SELECT MaPhong FROM PhongChieu ORDER BY MaPhong";
        $roomsResult = mysqli_query($conn, $roomsQuery);
        $roomIds = [];
        while ($room = mysqli_fetch_assoc($roomsResult)) {
            $roomIds[] = $room['MaPhong'];
        }
        
        $movies = [];
        while ($movie = mysqli_fetch_assoc($moviesResult)) {
            // Lọc phim theo ngày
            $movieStartDate = $movie['NgayKhoiChieu'];
            $isEligible = false;
            
            if ($movie['TrangThai'] === 'Phim đang chiếu') {
                $isEligible = true; // Phim đang chiếu luôn đủ điều kiện
            } elseif ($movie['TrangThai'] === 'Phim sắp chiếu') {
                // Phim sắp chiếu chỉ lấy nếu khởi chiếu trong 60 ngày tới
                if ($movieStartDate <= $futureDate) {
                    $isEligible = true;
                }
            }
            
            if ($isEligible) {
                $movies[] = $movie;
            }
        }
        
        foreach ($movies as $movieIndex => $movie) {
            // Xác định khoảng thời gian tạo lịch chiếu
            $movieStartDate = $movie['NgayKhoiChieu'];
            $movieEndDate = date('Y-m-d', strtotime('+30 days')); // Mặc định 30 ngày từ hôm nay
            
            // Chỉ tạo lịch từ hôm nay trở đi
            $scheduleStartDate = max($movieStartDate, $today);
            
            // Giới hạn lịch chiếu trong 30 ngày từ hôm nay
            $scheduleEndDate = min($movieEndDate, date('Y-m-d', strtotime('+30 days')));
            
            // Chỉ tạo lịch nếu ngày bắt đầu <= ngày kết thúc
            if ($scheduleStartDate <= $scheduleEndDate) {
                foreach ($roomIds as $roomIndex => $roomId) {
                    $generated = generateShowtimesWithDistribution(
                        $conn, 
                        $movie['MaPhim'], 
                        $scheduleStartDate, 
                        $scheduleEndDate, 
                        $roomId, 
                        $movieIndex, 
                        $roomIndex
                    );
                    $totalGenerated += $generated;
                }
                $processedMovies++;
            }
        }
        
        echo json_encode([
            "success" => true,
            "message" => "Tạo suất chiếu tự động thành công",
            "total_generated" => $totalGenerated,
            "movies_processed" => $processedMovies,
            "rooms_processed" => count($roomIds),
            "movies_found" => count($movies),
            "timestamp" => date('Y-m-d H:i:s')
        ]);
        
    } else {
        // Tạo suất chiếu cho phim cụ thể
        $movieId = $input['movieId'];
        $startDate = $input['startDate'];
        $endDate = $input['endDate'];
        $roomId = $input['roomId'];
        
        // Kiểm tra thông tin phim
        $movieQuery = "
            SELECT MaPhim, TenPhim, NgayKhoiChieu, ThoiLuong, TrangThai 
            FROM Phim 
            WHERE MaPhim = ?
        ";
        $movieStmt = mysqli_prepare($conn, $movieQuery);
        mysqli_stmt_bind_param($movieStmt, "s", $movieId);
        mysqli_stmt_execute($movieStmt);
        $movieResult = mysqli_stmt_get_result($movieStmt);
        $movie = mysqli_fetch_assoc($movieResult);
        
        if (!$movie) {
            throw new Exception("Không tìm thấy phim với mã: $movieId");
        }
        
        // Kiểm tra trạng thái phim
        if (!in_array($movie['TrangThai'], ['Phim đang chiếu', 'Phim sắp chiếu'])) {
            throw new Exception("Phim '{$movie['TenPhim']}' không trong trạng thái chiếu (Trạng thái: {$movie['TrangThai']})");
        }
        
        // Đảm bảo không tạo suất chiếu trước ngày khởi chiếu
        $actualStartDate = max($startDate, $movie['NgayKhoiChieu']);
        
        // Sử dụng endDate từ input hoặc mặc định 30 ngày
        $actualEndDate = $endDate;
        
        $generated = generateShowtimes($conn, $movieId, $actualStartDate, $actualEndDate, $roomId);
        
        echo json_encode([
            "success" => true,
            "message" => "Tạo suất chiếu thành công cho phim '{$movie['TenPhim']}'",
            "generated_count" => $generated,
            "movie_info" => [
                "MaPhim" => $movie['MaPhim'],
                "TenPhim" => $movie['TenPhim'],
                "TrangThai" => $movie['TrangThai'],
                "NgayKhoiChieu" => $movie['NgayKhoiChieu']
            ],
            "schedule_period" => [
                "start" => $actualStartDate,
                "end" => $actualEndDate
            ],
            "timestamp" => date('Y-m-d H:i:s')
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage(),
        "timestamp" => date('Y-m-d H:i:s')
    ]);
}

mysqli_close($conn);
?>