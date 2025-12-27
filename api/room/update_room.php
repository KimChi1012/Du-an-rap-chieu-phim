<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

// ✅ HÀM KIỂM TRA GHẾ ĐÃ ĐƯỢC ĐẶT
function hasBookedSeats($conn, $maPhong) {
    // Kiểm tra trong bảng ghesuatchieu
    $checkBookedSql = "SELECT COUNT(*) as count FROM ghesuatchieu gsc 
                       INNER JOIN ghe g ON gsc.MaGhe = g.MaGhe 
                       WHERE g.MaPhong = ? AND gsc.TrangThai = 'Đã đặt'";
    $checkStmt = $conn->prepare($checkBookedSql);
    $checkStmt->bind_param("s", $maPhong);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    $count = $result->fetch_assoc()['count'];
    
    return $count > 0;
}

// ✅ HÀM CẬP NHẬT GHẾ THEO SỐ LƯỢNG MỚI
function updateSeatsForRoom($conn, $maPhong, $soLuongGheMoi) {
    // Lấy số lượng ghế hiện tại
    $currentSeatsSql = "SELECT COUNT(*) as count FROM Ghe WHERE MaPhong = ?";
    $currentStmt = $conn->prepare($currentSeatsSql);
    $currentStmt->bind_param("s", $maPhong);
    $currentStmt->execute();
    $currentResult = $currentStmt->get_result();
    $soLuongGheHienTai = $currentResult->fetch_assoc()['count'];
    
    if ($soLuongGheMoi > $soLuongGheHienTai) {
        // Thêm ghế mới
        $soGheCanThem = $soLuongGheMoi - $soLuongGheHienTai;
        
        // Lấy số ghế cuối cùng
        $lastSeatSql = "SELECT MaGhe FROM Ghe WHERE MaPhong = ? ORDER BY MaGhe DESC LIMIT 1";
        $lastStmt = $conn->prepare($lastSeatSql);
        $lastStmt->bind_param("s", $maPhong);
        $lastStmt->execute();
        $lastResult = $lastStmt->get_result();
        
        $seatNumber = 1;
        if ($lastResult->num_rows > 0) {
            $lastSeat = $lastResult->fetch_assoc()['MaGhe'];
            $seatNumber = intval(substr($lastSeat, -2)) + 1;
        }
        
        // Tạo ghế mới
        $hangGhe = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
        $createdSeats = 0;
        
        for ($i = 0; $i < $soGheCanThem; $i++) {
            $maGhe = $maPhong . '_' . str_pad($seatNumber + $i, 2, '0', STR_PAD_LEFT);
            $hangIndex = ($seatNumber + $i - 1) % count($hangGhe);
            $soHang = $hangGhe[$hangIndex];
            $cot = floor(($seatNumber + $i - 1) / count($hangGhe)) + 1;
            
            $loaiGhe = 'Thường';
            if ($hangIndex >= count($hangGhe) - 2) {
                $loaiGhe = ($cot <= 2 || $cot >= 8) ? 'Đôi' : 'VIP';
            }
            
            $insertSql = "INSERT INTO Ghe (MaGhe, MaPhong, SoHang, SoCot, LoaiGhe, TrangThai) VALUES (?, ?, ?, ?, ?, 'Trống')";
            $insertStmt = $conn->prepare($insertSql);
            $insertStmt->bind_param("sssss", $maGhe, $maPhong, $soHang, $cot, $loaiGhe);
            
            if ($insertStmt->execute()) {
                $createdSeats++;
            }
        }
        
        return "Đã thêm $createdSeats ghế mới";
        
    } elseif ($soLuongGheMoi < $soLuongGheHienTai) {
        // Xóa ghế thừa (chỉ xóa ghế chưa được đặt)
        $soGheCanXoa = $soLuongGheHienTai - $soLuongGheMoi;
        
        // Lấy danh sách ghế chưa được đặt để xóa
        $unBookedSeatsSql = "SELECT g.MaGhe FROM Ghe g 
                            LEFT JOIN ghesuatchieu gsc ON g.MaGhe = gsc.MaGhe AND gsc.TrangThai = 'Đã đặt'
                            WHERE g.MaPhong = ? AND gsc.MaGhe IS NULL 
                            ORDER BY g.MaGhe DESC LIMIT ?";
        $unBookedStmt = $conn->prepare($unBookedSeatsSql);
        $unBookedStmt->bind_param("si", $maPhong, $soGheCanXoa);
        $unBookedStmt->execute();
        $unBookedResult = $unBookedStmt->get_result();
        
        $deletedSeats = 0;
        while ($seat = $unBookedResult->fetch_assoc()) {
            $deleteSql = "DELETE FROM Ghe WHERE MaGhe = ?";
            $deleteStmt = $conn->prepare($deleteSql);
            $deleteStmt->bind_param("s", $seat['MaGhe']);
            
            if ($deleteStmt->execute()) {
                $deletedSeats++;
            }
        }
        
        if ($deletedSeats < $soGheCanXoa) {
            throw new Exception("Chỉ có thể xóa $deletedSeats ghế. Còn lại " . ($soGheCanXoa - $deletedSeats) . " ghế đã được đặt không thể xóa.");
        }
        
        return "Đã xóa $deletedSeats ghế";
    }
    
    return "Số lượng ghế không thay đổi";
}

try {
    // Lấy dữ liệu từ POST hoặc JSON
    $input = $_POST;
    
    // Nếu không có POST data, thử lấy từ JSON
    if (empty($input)) {
        $json = file_get_contents('php://input');
        $input = json_decode($json, true);
    }
    
    if (empty($input)) {
        throw new Exception("Dữ liệu không hợp lệ");
    }

    // Validate required fields
    $requiredFields = ['MaPhong', 'TenPhong', 'LoaiPhong', 'SoLuongGhe'];
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Trường {$field} là bắt buộc");
        }
    }

    // ✅ VALIDATE SỐ LƯỢNG GHẾ
    $soLuongGhe = intval($input['SoLuongGhe']);
    if ($soLuongGhe <= 0) {
        throw new Exception("Số lượng ghế phải là số dương");
    }
    if ($soLuongGhe > 200) {
        throw new Exception("Số lượng ghế không được vượt quá 200");
    }

    // ✅ VALIDATE LOẠI PHÒNG
    $validRoomTypes = ['2D', '3D', '4DX', 'IMAX'];
    if (!in_array($input['LoaiPhong'], $validRoomTypes)) {
        throw new Exception("Loại phòng không hợp lệ. Chỉ chấp nhận: " . implode(', ', $validRoomTypes));
    }

    // Check if record exists
    $checkSql = "SELECT MaPhong FROM PhongChieu WHERE MaPhong = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("s", $input['MaPhong']);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception("Không tìm thấy phòng chiếu với mã: " . $input['MaPhong']);
    }

    // ✅ KIỂM TRA TRÙNG TÊN PHÒNG (trừ chính nó)
    $checkNameSql = "SELECT TenPhong FROM PhongChieu WHERE TenPhong = ? AND MaPhong != ?";
    $checkNameStmt = $conn->prepare($checkNameSql);
    $checkNameStmt->bind_param("ss", $input['TenPhong'], $input['MaPhong']);
    $checkNameStmt->execute();
    $nameResult = $checkNameStmt->get_result();
    
    if ($nameResult->num_rows > 0) {
        throw new Exception("Tên phòng đã tồn tại: " . $input['TenPhong']);
    }

    // ✅ KIỂM TRA GHẾ ĐÃ ĐƯỢC ĐẶT TRƯỚC KHI SỬA
    if (hasBookedSeats($conn, $input['MaPhong'])) {
        // Nếu có ghế đã được đặt, chỉ cho phép sửa tên và loại phòng, không cho thay đổi số lượng ghế
        $currentRoomSql = "SELECT SoLuongGhe FROM PhongChieu WHERE MaPhong = ?";
        $currentStmt = $conn->prepare($currentRoomSql);
        $currentStmt->bind_param("s", $input['MaPhong']);
        $currentStmt->execute();
        $currentResult = $currentStmt->get_result();
        $currentRoom = $currentResult->fetch_assoc();
        
        if ($currentRoom['SoLuongGhe'] != $soLuongGhe) {
            throw new Exception("Không thể thay đổi số lượng ghế vì phòng có ghế đã được đặt. Chỉ có thể sửa tên phòng và loại phòng.");
        }
    }

    // ✅ BẮT ĐẦU TRANSACTION
    $conn->begin_transaction();

    try {
        // ✅ CẬP NHẬT THÔNG TIN PHÒNG
        $sql = "UPDATE PhongChieu SET TenPhong = ?, LoaiPhong = ?, SoLuongGhe = ? WHERE MaPhong = ?";
        $stmt = $conn->prepare($sql);
        
        if (!$stmt) {
            throw new Exception("Lỗi chuẩn bị câu lệnh: " . $conn->error);
        }

        $stmt->bind_param("ssis", 
            $input['TenPhong'], 
            $input['LoaiPhong'], 
            $input['SoLuongGhe'], 
            $input['MaPhong']
        );

        if (!$stmt->execute()) {
            throw new Exception("Lỗi thực thi câu lệnh: " . $stmt->error);
        }

        if ($stmt->affected_rows === 0) {
            throw new Exception("Không có thay đổi nào được thực hiện");
        }

        // ✅ CẬP NHẬT GHẾ THEO SỐ LƯỢNG MỚI
        $seatUpdateMessage = updateSeatsForRoom($conn, $input['MaPhong'], $soLuongGhe);

        // ✅ COMMIT TRANSACTION
        $conn->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Cập nhật phòng chiếu thành công. ' . $seatUpdateMessage,
            'data' => [
                'MaPhong' => $input['MaPhong'],
                'TenPhong' => $input['TenPhong'],
                'LoaiPhong' => $input['LoaiPhong'],
                'SoLuongGhe' => $input['SoLuongGhe'],
                'SeatUpdate' => $seatUpdateMessage
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
?>