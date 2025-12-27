<?php
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include '../db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['userId']) || !isset($input['paymentMethod']) || !isset($input['amount']) || !isset($input['showtime'])) {
    $debug_info = [
        'userId' => isset($input['userId']),
        'paymentMethod' => isset($input['paymentMethod']),
        'amount' => isset($input['amount']),
        'showtime' => isset($input['showtime']),
        'received_data' => $input
    ];
    echo json_encode([
        "success" => false, 
        "message" => "Thiếu thông tin cần thiết",
        "debug" => $debug_info
    ]);
    exit;
}

$userId = $input['userId'];
$paymentMethod = $input['paymentMethod'];
$accountNumber = $input['accountNumber'] ?? '';
$amount = $input['amount'];
$showtime = $input['showtime'];
$selectedSeats = $input['selectedSeats'] ?? [];
$selectedServices = $input['selectedServices'] ?? [];

$paymentMethodNames = [
    'momo' => 'Ví Momo',
    'zalopay' => 'ZaloPay',
    'bank' => 'Chuyển khoản ngân hàng',
    'shopeepay' => 'ShopeePay'
];

$paymentMethodName = $paymentMethodNames[$paymentMethod] ?? $paymentMethod;

try {
    if (empty($accountNumber) || strlen($accountNumber) < 6) {
        echo json_encode(["success" => false, "message" => "Số tài khoản/số điện thoại không hợp lệ"]);
        exit;
    }
    
    $stmt = $conn->prepare("SELECT HoTen FROM NguoiDung WHERE MaND = ?");
    $stmt->bind_param("s", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Người dùng không tồn tại"]);
        exit;
    }
    
    $user = $result->fetch_assoc();
    
    $conn->autocommit(false);
    
    // 1. Tạo mã hóa đơn mới
    $stmt = $conn->prepare("SELECT MAX(CAST(SUBSTRING(MaHD, 3) AS UNSIGNED)) as max_id FROM HoaDon");
    $stmt->execute();
    $result = $stmt->get_result();
    $maxId = $result->fetch_assoc()['max_id'] ?? 0;
    $newHDId = 'HD' . str_pad($maxId + 1, 4, '0', STR_PAD_LEFT);
    
    // 2. Tạo hóa đơn
    $stmt = $conn->prepare("INSERT INTO HoaDon (MaHD, MaND, NgayLap, TongTien) VALUES (?, ?, NOW(), ?)");
    $stmt->bind_param("ssi", $newHDId, $userId, $amount);
    
    if (!$stmt->execute()) {
        throw new Exception("Lỗi tạo hóa đơn: " . $stmt->error);
    }
    
    // 3. Lấy thông tin suất chiếu từ showtime
    $showtimeId = '';
    
    if (isset($showtime['MaSuat'])) {
        $showtimeId = $showtime['MaSuat'];
    } elseif (isset($showtime['id'])) {
        $showtimeId = $showtime['id'];
    } elseif (isset($showtime['showtimeId'])) {
        $showtimeId = $showtime['showtimeId'];
    } elseif (isset($showtime['selectedShowtimeId'])) {
        $showtimeId = $showtime['selectedShowtimeId'];
    }
    
    if (empty($showtimeId)) {
        error_log("Showtime data received: " . json_encode($showtime));
        throw new Exception("Thiếu thông tin suất chiếu. Vui lòng chọn lại suất chiếu.");
    }
    
    $stmt = $conn->prepare("SELECT MaSuat, MaPhong FROM SuatChieu WHERE MaSuat = ?");
    $stmt->bind_param("s", $showtimeId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception("Suất chiếu không tồn tại");
    }
    
    $showtimeData = $result->fetch_assoc();
    $maSuat = $showtimeData['MaSuat'];
    $maPhong = $showtimeData['MaPhong'];
    
    // 4. Thêm chi tiết vé vào CTHDVe và cập nhật trạng thái ghế theo suất chiếu
    if (!empty($selectedSeats)) {
        foreach ($selectedSeats as $seat) {
            $seatPrice = $seat['price'] ?? 0;
            $seatId = $seat['id'] ?? '';
            
            $stmt = $conn->prepare("SELECT MaVe FROM VeSuatChieu WHERE MaGhe = ? AND MaSuat = ?");
            $stmt->bind_param("ss", $seatId, $maSuat);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $veData = $result->fetch_assoc();
                $veId = $veData['MaVe'];
                
                $stmt = $conn->prepare("INSERT INTO CTHDVe (MaHD, MaVe, MaSuat, MaGhe, GiaVe) VALUES (?, ?, ?, ?, ?)");
                $stmt->bind_param("ssssi", $newHDId, $veId, $maSuat, $seatId, $seatPrice);
                
                if (!$stmt->execute()) {
                    throw new Exception("Lỗi thêm chi tiết vé: " . $stmt->error);
                }

                $stmt = $conn->prepare("UPDATE GheSuatChieu SET TrangThai = 'Đã đặt', MaHD = ? WHERE MaSuat = ? AND MaGhe = ?");
                $stmt->bind_param("sss", $newHDId, $maSuat, $seatId);
                
                if (!$stmt->execute()) {
                    throw new Exception("Lỗi cập nhật trạng thái ghế: " . $stmt->error);
                }
                
            } else {
                throw new Exception("Không tìm thấy vé cho ghế: " . $seatId);
            }
        }
    }
    
    // 5. Thêm chi tiết dịch vụ vào CTHDDichVu
    if (!empty($selectedServices)) {
        foreach ($selectedServices as $service) {
            $serviceId = $service['id'] ?? '';
            $quantity = $service['quantity'] ?? 1;
            $servicePrice = $service['price'] ?? 0;
            $totalServicePrice = $servicePrice * $quantity;
            
            $stmt = $conn->prepare("INSERT INTO CTHDDichVu (MaHD, MaDV, SoLuong, ThanhTien) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("ssii", $newHDId, $serviceId, $quantity, $totalServicePrice);
            
            if (!$stmt->execute()) {
                throw new Exception("Lỗi thêm chi tiết dịch vụ: " . $stmt->error);
            }
        }
    }
    
    // 6. Tạo mã thanh toán mới
    $stmt = $conn->prepare("SELECT MAX(CAST(SUBSTRING(MaThanhToan, 3) AS UNSIGNED)) as max_tt_id FROM ThanhToan");
    $stmt->execute();
    $result = $stmt->get_result();
    $maxTTId = $result->fetch_assoc()['max_tt_id'] ?? 0;
    $newTTId = 'TT' . str_pad($maxTTId + 1, 4, '0', STR_PAD_LEFT);
    
    // 7. Tạo bản ghi thanh toán
    $stmt = $conn->prepare("INSERT INTO ThanhToan (MaThanhToan, MaHD, PhuongThuc, SoTienPhaiTra, SoTienKhachTra, NgayThanhToan, TrangThai) VALUES (?, ?, ?, ?, ?, NOW(), 'Thành công')");
    $stmt->bind_param("sssii", $newTTId, $newHDId, $paymentMethodName, $amount, $amount);
    
    if (!$stmt->execute()) {
        throw new Exception("Lỗi tạo bản ghi thanh toán: " . $stmt->error);
    }
    
    $conn->commit();
    
    echo json_encode([
        "success" => true, 
        "message" => "Thanh toán thành công",
        "data" => [
            "invoiceId" => $newHDId,
            "paymentId" => $newTTId,
            "amount" => $amount,
            "paymentMethod" => $paymentMethodName,
            "accountNumber" => $accountNumber,
            "userName" => $user['HoTen']
        ]
    ]);
    
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(["success" => false, "message" => "Lỗi xử lý thanh toán: " . $e->getMessage()]);
}

$conn->close();
?>