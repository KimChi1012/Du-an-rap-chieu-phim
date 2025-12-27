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
    $today = date('Y-m-d');
    $futureDate = date('Y-m-d', strtotime('+60 days'));
    
    // Lấy thông tin phim đang chiếu và sắp chiếu
    $moviesQuery = "
        SELECT MaPhim, TenPhim, ThoiLuong, NgayKhoiChieu, TrangThai 
        FROM Phim 
        WHERE TrangThai IN ('Phim đang chiếu', 'Phim sắp chiếu')
        AND NgayKhoiChieu IS NOT NULL
        AND ThoiLuong > 0
        ORDER BY TrangThai DESC, NgayKhoiChieu ASC
    ";
    
    $moviesResult = mysqli_query($conn, $moviesQuery);
    if (!$moviesResult) {
        throw new Exception("Lỗi truy vấn phim: " . mysqli_error($conn));
    }
    
    $movies = [];
    $showingMovies = 0;
    $upcomingMovies = 0;
    
    while ($movie = mysqli_fetch_assoc($moviesResult)) {
        // Lọc phim theo ngày
        $movieStartDate = $movie['NgayKhoiChieu'];
        $isEligible = false;
        
        if ($movie['TrangThai'] === 'Phim đang chiếu') {
            $isEligible = true; // Phim đang chiếu luôn đủ điều kiện
            $showingMovies++;
        } elseif ($movie['TrangThai'] === 'Phim sắp chiếu') {
            // Phim sắp chiếu chỉ lấy nếu khởi chiếu trong 60 ngày tới
            if ($movieStartDate <= $futureDate) {
                $isEligible = true;
                $upcomingMovies++;
            }
        }
        
        if ($isEligible && $movie['ThoiLuong'] > 0) {
            $movies[] = $movie;
        }
    }
    
    // Lấy thông tin phòng chiếu
    $roomsQuery = "SELECT MaPhong, TenPhong, LoaiPhong FROM PhongChieu ORDER BY MaPhong";
    $roomsResult = mysqli_query($conn, $roomsQuery);
    $rooms = [];
    while ($room = mysqli_fetch_assoc($roomsResult)) {
        $rooms[] = $room;
    }
    
    // Tính toán số suất chiếu sẽ được tạo
    $timeSlots = ['09:00:00', '14:00:00', '19:00:00'];
    $daysToGenerate = 30; // 30 ngày tới
    
    // Ước tính số suất chiếu có thể tạo (mỗi phim 1 suất/ngày/phòng để tránh trùng lặp)
    $estimatedShowtimes = count($movies) * count($rooms) * $daysToGenerate;
    
    // Kiểm tra số suất chiếu hiện có trong tương lai
    $existingQuery = "SELECT COUNT(*) as total FROM SuatChieu WHERE NgayChieu >= ?";
    $existingStmt = mysqli_prepare($conn, $existingQuery);
    mysqli_stmt_bind_param($existingStmt, "s", $today);
    mysqli_stmt_execute($existingStmt);
    $existingResult = mysqli_stmt_get_result($existingStmt);
    $existingCount = mysqli_fetch_assoc($existingResult)['total'];
    
    echo json_encode([
        'success' => true,
        'info' => [
            'total_eligible_movies' => count($movies),
            'movies_showing' => $showingMovies,
            'movies_upcoming' => $upcomingMovies,
            'available_rooms' => count($rooms),
            'time_slots_per_day' => count($timeSlots),
            'days_to_generate' => $daysToGenerate,
            'estimated_new_showtimes' => max(0, $estimatedShowtimes - $existingCount),
            'existing_future_showtimes' => $existingCount
        ],
        'movies' => array_map(function($movie) {
            return [
                'MaPhim' => $movie['MaPhim'],
                'TenPhim' => $movie['TenPhim'],
                'TrangThai' => $movie['TrangThai'],
                'NgayKhoiChieu' => $movie['NgayKhoiChieu'],
                'ThoiLuong' => $movie['ThoiLuong']
            ];
        }, $movies),
        'rooms' => $rooms,
        'time_slots' => [
            ['time' => '09:00:00', 'description' => 'Suất sáng'],
            ['time' => '14:00:00', 'description' => 'Suất chiều'],
            ['time' => '19:00:00', 'description' => 'Suất tối']
        ],
        'generation_plan' => [
            "Tạo lịch chiếu cho {$showingMovies} phim đang chiếu và {$upcomingMovies} phim sắp chiếu",
            'Sử dụng ' . count($rooms) . ' phòng chiếu',
            'Mỗi ngày có 3 khung giờ: 09:00, 14:00, 19:00',
            'Tạo lịch cho 30 ngày tới',
            'Chỉ tạo từ ngày khởi chiếu của phim',
            'Không tạo sau ngày kết thúc chiếu (nếu có)',
            'Tự động tránh trùng lịch và xung đột thời gian',
            'Phân bổ thông minh để tránh trùng lặp'
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

mysqli_close($conn);
?>