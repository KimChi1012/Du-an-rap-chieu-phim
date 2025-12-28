<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

try {
    // ✅ LẤY DỮ LIỆU TỪ FORM DATA
    if (empty($_POST)) {
        throw new Exception("Dữ liệu không hợp lệ");
    }

    $MaDV        = $_POST['MaDV'] ?? '';
    $TenDV       = $_POST['TenDV'] ?? '';
    $DonGia      = $_POST['DonGia'] ?? '';
    $MoTa        = $_POST['MoTa'] ?? '';
    $Anh         = ''; // Ảnh sẽ được xử lý riêng

    // ✅ VALIDATE
    if ($TenDV == '' || $DonGia == '' || $MoTa == '') {
        throw new Exception("Thiếu dữ liệu bắt buộc");
    }

    // ✅ TẠO MaDV NẾU CHƯA CÓ (fallback)
    if ($MaDV == '') {
        $rs = $conn->query("SELECT COUNT(*) AS total FROM DichVu");
        $count = $rs->fetch_assoc()['total'] + 1;
        $MaDV = 'DV' . str_pad($count, 3, '0', STR_PAD_LEFT);
    }

    // ✅ KIỂM TRA TRÙNG MÃ
    $checkSql = "SELECT MaDV FROM DichVu WHERE MaDV = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("s", $MaDV);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows > 0) {
        throw new Exception("Mã dịch vụ '$MaDV' đã tồn tại");
    }

    // ✅ XỬ LÝ ẢNH (sau khi có MaDV)
    $fileName = '';
    if (isset($_FILES['Anh']) && $_FILES['Anh']['error'] == 0) {
        // Kiểm tra loại file
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($_FILES['Anh']['type'], $allowedTypes)) {
            throw new Exception("Chỉ chấp nhận file ảnh (JPG, PNG, GIF, WEBP)");
        }
        
        // Kiểm tra kích thước file (max 2MB)
        if ($_FILES['Anh']['size'] > 2 * 1024 * 1024) {
            throw new Exception("Kích thước ảnh không được vượt quá 2MB");
        }
        
        // Tạo thư mục images nếu chưa có
        $uploadDir = "../../public/images/";
        if (!is_dir($uploadDir)) {
            if (!mkdir($uploadDir, 0777, true)) {
                throw new Exception("Không thể tạo thư mục images");
            }
        }
        
        // Kiểm tra quyền ghi
        if (!is_writable($uploadDir)) {
            throw new Exception("Thư mục images không có quyền ghi");
        }
        
        // Tạo tên file theo mã dịch vụ: DV001 -> dv1.extension
        $fileExtension = pathinfo($_FILES['Anh']['name'], PATHINFO_EXTENSION);
        $serviceNumber = intval(substr($MaDV, 2)); // Lấy số từ DV001 -> 1
        $fileName = 'dv' . $serviceNumber . '.' . $fileExtension;
        $uploadPath = $uploadDir . $fileName;

        // Log để debug
        error_log("Service Code: $MaDV -> Image Name: $fileName");

        // Xóa file cũ nếu tồn tại
        if (file_exists($uploadPath)) {
            unlink($uploadPath);
        }

        if (!move_uploaded_file($_FILES['Anh']['tmp_name'], $uploadPath)) {
            throw new Exception("Upload ảnh thất bại. Kiểm tra quyền thư mục images");
        }
        
        $fileName = "images/" . $fileName; // Đường dẫn lưu trong DB
    } else {
        // Không bắt buộc ảnh khi thêm mới
        $fileName = "images/default-service.svg"; // Ảnh mặc định
    }

    // ✅ INSERT
    $sql = "INSERT INTO DichVu (MaDV, TenDV, DonGia, MoTa, Anh) VALUES (?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssss",
        $MaDV,
        $TenDV,
        $DonGia,
        $MoTa,
        $fileName
    );

    if (!$stmt->execute()) {
        throw new Exception("Lỗi thêm dịch vụ");
    }

    echo json_encode([
        'success' => true,
        'message' => 'Thêm dịch vụ thành công'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
