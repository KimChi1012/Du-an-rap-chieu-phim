<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../db.php';

try {
    $showtime_id = $_GET['showtime_id'] ?? '';
    
    if (empty($showtime_id)) {
        throw new Exception('Showtime ID is required');
    }

    $showtime_sql = "SELECT 
                        sc.MaSuat,
                        sc.MaPhim,
                        sc.MaPhong,
                        sc.NgayChieu,
                        sc.GioBatDau,
                        sc.GioKetThuc,
                        p.TenPhong,
                        p.LoaiPhong,
                        p.SoLuongGhe,
                        ph.TenPhim,
                        ph.Poster,
                        ph.DinhDang,
                        ph.NgonNgu
                    FROM SuatChieu sc
                    JOIN PhongChieu p ON sc.MaPhong = p.MaPhong
                    JOIN Phim ph ON sc.MaPhim = ph.MaPhim
                    WHERE sc.MaSuat = ?";
    
    $stmt = mysqli_prepare($conn, $showtime_sql);
    if (!$stmt) {
        throw new Exception('Prepare showtime query failed: ' . mysqli_error($conn));
    }
    
    mysqli_stmt_bind_param($stmt, 's', $showtime_id);
    mysqli_stmt_execute($stmt);
    $showtime_result = mysqli_stmt_get_result($stmt);
    
    if (mysqli_num_rows($showtime_result) === 0) {
        throw new Exception('Showtime not found');
    }
    
    $showtime = mysqli_fetch_assoc($showtime_result);
    mysqli_stmt_close($stmt);

    $seats_sql = "SELECT 
                    g.MaGhe,
                    g.MaPhong,
                    g.SoHang,
                    g.SoCot,
                    g.LoaiGhe,
                    g.TrangThai,
                    v.GiaVe
                FROM Ghe g
                LEFT JOIN Ve v ON g.MaGhe = v.MaGhe AND g.MaPhong = v.MaPhong
                WHERE g.MaPhong = ?
                ORDER BY g.SoHang, g.SoCot";
    
    $stmt = mysqli_prepare($conn, $seats_sql);
    if (!$stmt) {
        throw new Exception('Prepare seats query failed: ' . mysqli_error($conn));
    }
    
    mysqli_stmt_bind_param($stmt, 's', $showtime['MaPhong']);
    mysqli_stmt_execute($stmt);
    $seats_result = mysqli_stmt_get_result($stmt);
    
    $seats = [];
    $seatLayout = [];
    $rows = [];
    
    while ($row = mysqli_fetch_assoc($seats_result)) {
        $seats[] = $row;

        $rowLetter = $row['SoHang'];
        $colNumber = $row['SoCot'];
        
        if (!isset($seatLayout[$rowLetter])) {
            $seatLayout[$rowLetter] = [];
            $rows[] = $rowLetter;
        }
        
        $seatLayout[$rowLetter][$colNumber] = [
            'MaGhe' => $row['MaGhe'],
            'LoaiGhe' => $row['LoaiGhe'],
            'TrangThai' => $row['TrangThai'],
            'SoHang' => $rowLetter,
            'SoCot' => $colNumber,
            'GiaVe' => (int)$row['GiaVe']
        ];
    }
    
    mysqli_stmt_close($stmt);

    sort($rows);

    $maxCols = 0;
    foreach ($seatLayout as $row) {
        $maxCols = max($maxCols, max(array_keys($row)));
    }

    $seatStats = [
        'Thường' => ['count' => 0, 'price' => 0],
        'VIP' => ['count' => 0, 'price' => 0],
        'Đôi' => ['count' => 0, 'price' => 0]
    ];
    
    foreach ($seats as $seat) {
        if (isset($seatStats[$seat['LoaiGhe']])) {
            $seatStats[$seat['LoaiGhe']]['count']++;
            if ($seatStats[$seat['LoaiGhe']]['price'] == 0) {
                $seatStats[$seat['LoaiGhe']]['price'] = (int)$seat['GiaVe'];
            }
        }
    }

    echo json_encode([
        'success' => true,
        'showtime' => $showtime,
        'seats' => $seats,
        'seatLayout' => $seatLayout,
        'theater' => [
            'MaPhong' => $showtime['MaPhong'],
            'TenPhong' => $showtime['TenPhong'],
            'LoaiPhong' => $showtime['LoaiPhong'],
            'SoLuongGhe' => $showtime['SoLuongGhe']
        ],
        'layout' => [
            'rows' => $rows,
            'maxCols' => $maxCols,
            'totalRows' => count($rows),
            'seatStats' => $seatStats
        ],
        'debug' => [
            'showtime_id' => $showtime_id,
            'total_seats' => count($seats),
            'room_id' => $showtime['MaPhong']
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