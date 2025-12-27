<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../db.php';

try {
    $movie_id = $_GET['movie_id'] ?? '';
    $specific_date = $_GET['date'] ?? '';
    
    if (empty($movie_id)) {
        throw new Exception('Movie ID is required');
    }

    date_default_timezone_set('Asia/Ho_Chi_Minh');
    
    $dates = [];
    $today = new DateTime('today');
    
    error_log("Current server date: " . $today->format('Y-m-d H:i:s'));
    
    for ($i = 0; $i < 7; $i++) {
        $date = clone $today;
        $date->add(new DateInterval("P{$i}D"));
        
        $dayNames = [
            'Sunday' => 'Chủ Nhật',
            'Monday' => 'Thứ Hai', 
            'Tuesday' => 'Thứ Ba',
            'Wednesday' => 'Thứ Tư',
            'Thursday' => 'Thứ Năm',
            'Friday' => 'Thứ Sáu',
            'Saturday' => 'Thứ Bảy'
        ];

        $dayName = '';
        if ($i === 0) {
            $dayName = 'Hôm nay';
        } elseif ($i === 1) {
            $dayName = 'Ngày mai';
        } else {
            $dayName = $dayNames[$date->format('l')];
        }
        
        $dates[] = [
            'date' => $date->format('Y-m-d'),
            'day' => $date->format('d/m'),
            'dayName' => $dayName
        ];
    }

    if (!empty($specific_date)) {
        $sql = "SELECT 
                    sc.MaSuat,
                    sc.NgayChieu,
                    sc.GioBatDau,
                    sc.GioKetThuc,
                    p.MaPhong,
                    p.TenPhong,
                    p.LoaiPhong,
                    p.SoLuongGhe,
                    ph.TenPhim,
                    ph.DinhDang,
                    ph.NgonNgu,
                    ph.Poster
                FROM SuatChieu sc
                JOIN PhongChieu p ON sc.MaPhong = p.MaPhong
                JOIN Phim ph ON sc.MaPhim = ph.MaPhim
                WHERE sc.MaPhim = ? 
                AND sc.NgayChieu = ?
                AND sc.NgayChieu >= CURDATE()
                ORDER BY sc.GioBatDau";
        
        $stmt = mysqli_prepare($conn, $sql);
        if (!$stmt) {
            throw new Exception('Prepare failed: ' . mysqli_error($conn));
        }
        
        mysqli_stmt_bind_param($stmt, 'ss', $movie_id, $specific_date);
    } else {
        $sql = "SELECT 
                    sc.MaSuat,
                    sc.NgayChieu,
                    sc.GioBatDau,
                    sc.GioKetThuc,
                    p.MaPhong,
                    p.TenPhong,
                    p.LoaiPhong,
                    p.SoLuongGhe,
                    ph.TenPhim,
                    ph.DinhDang,
                    ph.NgonNgu,
                    ph.Poster
                FROM SuatChieu sc
                JOIN PhongChieu p ON sc.MaPhong = p.MaPhong
                JOIN Phim ph ON sc.MaPhim = ph.MaPhim
                WHERE sc.MaPhim = ? 
                AND sc.NgayChieu >= CURDATE()
                AND sc.NgayChieu <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                ORDER BY sc.NgayChieu, sc.GioBatDau";
        
        $stmt = mysqli_prepare($conn, $sql);
        if (!$stmt) {
            throw new Exception('Prepare failed: ' . mysqli_error($conn));
        }
        
        mysqli_stmt_bind_param($stmt, 's', $movie_id);
    }
    
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    
    $showtimes = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $showtimes[] = $row;
    }
    
    mysqli_stmt_close($stmt);
    
    echo json_encode([
        'success' => true,
        'dates' => $dates,
        'showtimes' => $showtimes,
        'movie_id' => $movie_id,
        'requested_date' => $specific_date,
        'debug' => [
            'total_showtimes' => count($showtimes),
            'sql' => $sql,
            'specific_date_requested' => !empty($specific_date)
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'error' => $e->getMessage()
    ]);
}

mysqli_close($conn);
?>