<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

include '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

if (!isset($_GET['invoice'])) {
    echo json_encode(["success" => false, "message" => "Thiếu mã hóa đơn"]);
    exit;
}

$invoiceId = $_GET['invoice'];

try {
    $stmt = $conn->prepare("
        SELECT 
            hd.MaHD, hd.NgayLap, hd.TongTien,
            nd.HoTen, nd.Email,
            tt.MaThanhToan, tt.PhuongThuc, tt.NgayThanhToan, tt.TrangThai
        FROM HoaDon hd
        JOIN NguoiDung nd ON hd.MaND = nd.MaND
        JOIN ThanhToan tt ON hd.MaHD = tt.MaHD
        WHERE hd.MaHD = ?
    ");
    
    $stmt->bind_param("s", $invoiceId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Không tìm thấy hóa đơn"]);
        exit;
    }
    
    $invoice = $result->fetch_assoc();

    $stmt = $conn->prepare("
        SELECT DISTINCT
            p.TenPhim, p.Poster, p.DinhDang, p.NgonNgu,
            pc.TenPhong,
            sc.NgayChieu, sc.GioBatDau, sc.MaSuat
        FROM CTHDVe cv
        JOIN SuatChieu sc ON cv.MaSuat = sc.MaSuat
        JOIN Phim p ON sc.MaPhim = p.MaPhim
        JOIN PhongChieu pc ON sc.MaPhong = pc.MaPhong
        WHERE cv.MaHD = ?
        LIMIT 1
    ");
    
    $stmt->bind_param("s", $invoiceId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $showtimeInfo = $result->fetch_assoc();
        $invoice = array_merge($invoice, $showtimeInfo);
    }

    $stmt = $conn->prepare("
        SELECT 
            g.MaGhe, g.SoHang, g.SoCot, g.LoaiGhe, cv.GiaVe
        FROM CTHDVe cv
        JOIN Ghe g ON cv.MaGhe = g.MaGhe
        WHERE cv.MaHD = ?
    ");
    
    $stmt->bind_param("s", $invoiceId);
    $stmt->execute();
    $seatsResult = $stmt->get_result();
    
    $seats = [];
    while ($seat = $seatsResult->fetch_assoc()) {
        $seats[] = $seat;
    }

    $stmt = $conn->prepare("
        SELECT dv.TenDV, cd.SoLuong, cd.ThanhTien
        FROM CTHDDichVu cd
        JOIN DichVu dv ON cd.MaDV = dv.MaDV
        WHERE cd.MaHD = ?
    ");
    
    $stmt->bind_param("s", $invoiceId);
    $stmt->execute();
    $servicesResult = $stmt->get_result();
    
    $services = [];
    while ($service = $servicesResult->fetch_assoc()) {
        $services[] = $service;
    }

    $invoice['seats'] = $seats;
    $invoice['services'] = $services;
    
    echo json_encode([
        "success" => true,
        "data" => $invoice
    ]);
    
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Lỗi server: " . $e->getMessage()]);
}

$conn->close();
?>