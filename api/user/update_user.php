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
    $matkhau_hientai = $input['MatKhauHienTai'] ?? '';
    $matkhau_moi = $input['MatKhauMoi'] ?? '';
    
    // Xử lý NgaySinh - nếu rỗng thì set NULL
    if (empty($ngaysinh) || $ngaysinh === '') {
        $ngaysinh = null;
    }
    
    // Kiểm tra xem có cập nhật avatar không
    $hasAvatar = isset($input['Avatar']) && !empty($input['Avatar']);
    $avatar = $hasAvatar ? $input['Avatar'] : null;
    
    if (empty($mand) || empty($tendn) || empty($hoten) || empty($email) || empty($quyenhan)) {
        echo json_encode(['success' => false, 'error' => 'Vui lòng điền đầy đủ thông tin bắt buộc'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Chỉ yêu cầu mật khẩu hiện tại khi có mật khẩu mới
    if (!empty($matkhau_moi)) {
        if (empty($matkhau_hientai)) {
            echo json_encode(['success' => false, 'error' => 'Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu'], JSON_UNESCAPED_UNICODE);
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
    }
    
    // Xây dựng câu SQL động
    $updateFields = [];
    $params = [];
    $types = "";
    
    // Các trường luôn cập nhật
    $updateFields[] = "TenDN=?";
    $params[] = $tendn;
    $types .= "s";
    
    $updateFields[] = "HoTen=?";
    $params[] = $hoten;
    $types .= "s";
    
    $updateFields[] = "SoDT=?";
    $params[] = $sodt;
    $types .= "s";
    
    $updateFields[] = "ThanhPho=?";
    $params[] = $thanhpho;
    $types .= "s";
    
    if ($ngaysinh === null) {
        $updateFields[] = "NgaySinh=NULL";
    } else {
        $updateFields[] = "NgaySinh=?";
        $params[] = $ngaysinh;
        $types .= "s";
    }
    
    $updateFields[] = "Email=?";
    $params[] = $email;
    $types .= "s";
    
    $updateFields[] = "QuyenHan=?";
    $params[] = $quyenhan;
    $types .= "s";
    
    // Chỉ cập nhật mật khẩu nếu có mật khẩu mới
    if (!empty($matkhau_moi)) {
        $updateFields[] = "MatKhau=?";
        $params[] = $matkhau_moi;
        $types .= "s";
    }
    
    // Chỉ cập nhật avatar nếu có avatar mới
    if ($hasAvatar) {
        $updateFields[] = "Avatar=?";
        $params[] = $avatar;
        $types .= "s";
    }
    
    // Thêm MaND vào cuối
    $params[] = $mand;
    $types .= "s";
    
    $sql = "UPDATE NguoiDung SET " . implode(", ", $updateFields) . " WHERE MaND=?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        $message = !empty($matkhau_moi) ? 'Cập nhật người dùng và mật khẩu thành công' : 'Cập nhật người dùng thành công';
        echo json_encode(['success' => true, 'message' => $message], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['success' => false, 'error' => 'Lỗi khi cập nhật người dùng: ' . $stmt->error], JSON_UNESCAPED_UNICODE);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Lỗi hệ thống: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>