<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

// ✅ HÀM TẠO GHẾ TỰ ĐỘNG CHO PHÒNG
function createSeatsForRoom($conn, $maPhong, $soLuongGhe) {
    $createdSeats = 0;
    $seatNumber = 1;
    
    // Tính toán số hàng và cột dựa trên số lượng ghế
    $rows = ceil(sqrt($soLuongGhe / 10)) + 1; // Ước tính số hàng
    $cols = ceil($soLuongGhe / $rows); // Số cột mỗi hàng
    
    $hangGhe = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    
    for ($hang = 0; $hang < $rows && $createdSeats < $soLuongGhe; $hang++) {
        for ($cot = 1; $cot <= $cols && $createdSeats < $soLuongGhe; $cot++) {
            $maGhe = $maPhong . '_' . str_pad($seatNumber, 2, '0', STR_PAD_LEFT);
            $soHang = $hangGhe[$hang];
            
            // Xác định loại ghế dựa trên vị trí
            $loaiGhe = 'Thường';
            if ($hang >= $rows - 2) { // 2 hàng cuối
                if ($cot <= 2 || $cot >= $cols - 1) {
                    $loaiGhe = 'Đôi';
                } else {
                    $loaiGhe = 'VIP';
                }
            }
            
            $insertSeatSql = "INSERT INTO Ghe (MaGhe, MaPhong, SoHang, SoCot, LoaiGhe, TrangThai) VALUES (?, ?, ?, ?, ?, 'Trống')";
            $insertSeatStmt = $conn->prepare($insertSeatSql);
            $insertSeatStmt->bind_param("sssss", $maGhe, $maPhong, $soHang, $cot, $loaiGhe);
            
            if ($insertSeatStmt->execute()) {
                $createdSeats++;
                $seatNumber++;
            }
        }
    }
    
    return $createdSeats;
}

try {
    // ✅ LẤY DỮ LIỆU TỪ FORM DATA
    if (empty($_POST)) {
        throw new Exception("Dữ liệu không hợp lệ");
    }

    $MaPhong       = ''; // Luôn để trống để tự động tạo
    $TenPhong       = $_POST['TenPhong'] ?? '';
    $LoaiPhong        = $_POST['LoaiPhong'] ?? '';
    $SoLuongGhe  = $_POST['SoLuongGhe'] ?? '';
    
    // ✅ VALIDATE
    if ($TenPhong == '' || $LoaiPhong == '' || $SoLuongGhe == '') {
        throw new Exception("Thiếu dữ liệu bắt buộc");
    }

    // ✅ VALIDATE SỐ LƯỢNG GHẾ
    $soLuongGhe = intval($SoLuongGhe);
    if ($soLuongGhe <= 0) {
        throw new Exception("Số lượng ghế phải là số dương");
    }
    if ($soLuongGhe > 200) {
        throw new Exception("Số lượng ghế không được vượt quá 200");
    }

    // ✅ VALIDATE LOẠI PHÒNG
    $validRoomTypes = ['2D', '3D', '4DX', 'IMAX'];
    if (!in_array($LoaiPhong, $validRoomTypes)) {
        throw new Exception("Loại phòng không hợp lệ. Chỉ chấp nhận: " . implode(', ', $validRoomTypes));
    }

   

    // ✅ KIỂM TRA TRÙNG TÊN PHÒNG
    $checkNameSql = "SELECT TenPhong FROM PhongChieu WHERE TenPhong = ?";
    $checkNameStmt = $conn->prepare($checkNameSql);
    $checkNameStmt->bind_param("s", $TenPhong);
    $checkNameStmt->execute();
    $nameResult = $checkNameStmt->get_result();
    
    if ($nameResult->num_rows > 0) {
        throw new Exception("Tên phòng đã tồn tại: " . $TenPhong);
    }

    // ✅ TẠO MaPhong TỰ ĐỘNG
    $rs = $conn->query("SELECT COUNT(*) AS total FROM PhongChieu");
    $count = $rs->fetch_assoc()['total'] + 1;
    $MaPhong = 'P' . str_pad($count, 3, '0', STR_PAD_LEFT);
    
    // Kiểm tra mã tự động tạo có bị trùng không
    while (true) {
        $checkAutoSql = "SELECT MaPhong FROM PhongChieu WHERE MaPhong = ?";
        $checkAutoStmt = $conn->prepare($checkAutoSql);
        $checkAutoStmt->bind_param("s", $MaPhong);
        $checkAutoStmt->execute();
        $autoResult = $checkAutoStmt->get_result();
        
        if ($autoResult->num_rows == 0) {
            break; // Mã không trùng, sử dụng được
        }
        
        $count++;
        $MaPhong = 'P' . str_pad($count, 3, '0', STR_PAD_LEFT);
    }

    // ✅ BẮT ĐẦU TRANSACTION
    $conn->begin_transaction();

    try {
        // ✅ INSERT PHÒNG CHIẾU
        $sql = "INSERT INTO PhongChieu (MaPhong, TenPhong, LoaiPhong, SoLuongGhe) VALUES (?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssi",
            $MaPhong,
            $TenPhong,
            $LoaiPhong,
            $SoLuongGhe
        );

        if (!$stmt->execute()) {
            throw new Exception("Lỗi thêm phòng chiếu");
        }

        // ✅ TỰ ĐỘNG TẠO GHẾ CHO PHÒNG MỚI
        $createdSeats = createSeatsForRoom($conn, $MaPhong, $soLuongGhe);

        // ✅ COMMIT TRANSACTION
        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Thêm phòng chiếu thành công và tạo ' . $createdSeats . ' ghế',
            'data' => [
                'MaPhong' => $MaPhong,
                'TenPhong' => $TenPhong,
                'LoaiPhong' => $LoaiPhong,
                'SoLuongGhe' => $SoLuongGhe,
                'SoGheTao' => $createdSeats
            ]
        ], JSON_UNESCAPED_UNICODE);

    } catch (Exception $e) {
        $conn->rollback();
        throw $e;
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
