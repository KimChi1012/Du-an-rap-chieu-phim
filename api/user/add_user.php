<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Chỉ chấp nhận POST request'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);

    error_log("Add User - Received data: " . json_encode($input));
    
    $mand = $input['MaND'] ?? '';
    $tendn = $input['TenDN'] ?? '';
    $hoten = $input['HoTen'] ?? '';
    $sodt = $input['SoDT'] ?? '';
    $thanhpho = $input['ThanhPho'] ?? '';
    $ngaysinh = $input['NgaySinh'] ?? '';
    $email = $input['Email'] ?? '';
    $matkhau = $input['MatKhau'] ?? '';
    $quyenhan = $input['QuyenHan'] ?? '';
    $avatar = $input['Avatar'] ?? '';

    error_log("Add User - QuyenHan value: '" . $quyenhan . "'");
    
    if (empty($mand) || empty($tendn) || empty($hoten) || empty($email) || empty($matkhau) || empty($quyenhan)) {
        echo json_encode(['success' => false, 'error' => 'Vui lòng điền đầy đủ thông tin bắt buộc'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Kiểm tra trùng lặp
    $checkMaND = "SELECT COUNT(*) as count FROM NguoiDung WHERE MaND = ?";
    $stmt = $conn->prepare($checkMaND);
    $stmt->bind_param("s", $mand);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->fetch_assoc()['count'] > 0) {
        echo json_encode(['success' => false, 'error' => 'Mã người dùng đã tồn tại: ' . $mand], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    $checkTenDN = "SELECT COUNT(*) as count FROM NguoiDung WHERE TenDN = ?";
    $stmt = $conn->prepare($checkTenDN);
    $stmt->bind_param("s", $tendn);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->fetch_assoc()['count'] > 0) {
        echo json_encode(['success' => false, 'error' => 'Tên đăng nhập đã tồn tại: ' . $tendn], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    $checkEmail = "SELECT COUNT(*) as count FROM NguoiDung WHERE Email = ?";
    $stmt = $conn->prepare($checkEmail);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->fetch_assoc()['count'] > 0) {
        echo json_encode(['success' => false, 'error' => 'Email đã tồn tại: ' . $email], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    $sql = "INSERT INTO NguoiDung (MaND, TenDN, HoTen, SoDT, ThanhPho, NgaySinh, Email, MatKhau, QuyenHan, Avatar) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssssssssss", $mand, $tendn, $hoten, $sodt, $thanhpho, $ngaysinh, $email, $matkhau, $quyenhan, $avatar);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Thêm người dùng thành công'], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['success' => false, 'error' => 'Lỗi khi thêm người dùng: ' . $stmt->error], JSON_UNESCAPED_UNICODE);
    }
    
} catch (Exception $e) {
    // Chỉ set HTTP 500 cho lỗi hệ thống thực sự
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Lỗi hệ thống: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>