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
    
    $mand = $input['MaND'] ?? '';
    $tendn = $input['TenDN'] ?? '';
    $hoten = $input['HoTen'] ?? '';
    $sodt = $input['SoDT'] ?? '';
    $thanhpho = $input['ThanhPho'] ?? '';
    $ngaysinh = $input['NgaySinh'] ?? '';
    $email = $input['Email'] ?? '';
    $quyenhan = $input['QuyenHan'] ?? '';
    $avatar = $input['Avatar'] ?? '';
    $matkhau_hientai = $input['MatKhauHienTai'] ?? '';
    $matkhau_moi = $input['MatKhauMoi'] ?? '';
    
    if (empty($mand) || empty($tendn) || empty($hoten) || empty($email) || empty($quyenhan)) {
        echo json_encode(['success' => false, 'error' => 'Vui lòng điền đầy đủ thông tin bắt buộc'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (empty($matkhau_hientai)) {
        echo json_encode(['success' => false, 'error' => 'Vui lòng nhập mật khẩu hiện tại để xác nhận'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Kiểm tra mật khẩu hiện tại
    $checkSql = "SELECT MatKhau FROM NguoiDung WHERE MaND = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("s", $mand);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    $user = $result->fetch_assoc();
    
    if (!$user) {
        echo json_encode(['success' => false, 'error' => 'Không tìm thấy người dùng với mã: ' . $mand], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($user['MatKhau'] !== $matkhau_hientai) {
        echo json_encode(['success' => false, 'error' => 'Mật khẩu hiện tại không đúng'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Cập nhật với hoặc không có mật khẩu mới
    if (!empty($matkhau_moi)) {
        $sql = "UPDATE NguoiDung SET TenDN=?, HoTen=?, SoDT=?, ThanhPho=?, NgaySinh=?, Email=?, MatKhau=?, QuyenHan=?, Avatar=? WHERE MaND=?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssssssssss", $tendn, $hoten, $sodt, $thanhpho, $ngaysinh, $email, $matkhau_moi, $quyenhan, $avatar, $mand);
    } else {
        $sql = "UPDATE NguoiDung SET TenDN=?, HoTen=?, SoDT=?, ThanhPho=?, NgaySinh=?, Email=?, QuyenHan=?, Avatar=? WHERE MaND=?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssssssss", $tendn, $hoten, $sodt, $thanhpho, $ngaysinh, $email, $quyenhan, $avatar, $mand);
    }
    
    if ($stmt->execute()) {
        $message = !empty($matkhau_moi) ? 'Cập nhật người dùng và mật khẩu thành công' : 'Cập nhật người dùng thành công';
        echo json_encode(['success' => true, 'message' => $message], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['success' => false, 'error' => 'Lỗi khi cập nhật người dùng: ' . $stmt->error], JSON_UNESCAPED_UNICODE);
    }
    
} catch (Exception $e) {
    // Chỉ set HTTP 500 cho lỗi hệ thống thực sự (database connection, etc.)
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Lỗi hệ thống: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>