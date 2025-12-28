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

    // ✅ VALIDATE
    if ($MaDV == '' || $TenDV == '' || $DonGia == '' || $MoTa == '') {
        throw new Exception("Thiếu dữ liệu bắt buộc");
    }

    // Check if record exists and get old data
    $checkSql = "SELECT Anh FROM DichVu WHERE MaDV = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("s", $MaDV);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception("Không tìm thấy dịch vụ với mã: " . $MaDV);
    }
    
    $oldRow = $result->fetch_assoc(); // Lấy dữ liệu cũ trước

    // ✅ XỬ LÝ ẢNH CHO UPDATE
    $anhPath = '';
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
        
        $uploadDir = "../../public/images/";
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        // Tạo tên file theo mã dịch vụ: DV001 -> dv1.extension
        $fileExtension = pathinfo($_FILES['Anh']['name'], PATHINFO_EXTENSION);
        $serviceNumber = intval(substr($MaDV, 2)); // Lấy số từ DV001 -> 1
        $fileName = 'dv' . $serviceNumber . '.' . $fileExtension;
        $uploadPath = $uploadDir . $fileName;

        // Log để debug
        error_log("Update Service Code: $MaDV -> Image Name: $fileName");

        // Xóa file cũ nếu tồn tại (với extension khác)
        if ($oldRow['Anh'] && $oldRow['Anh'] !== 'images/default-service.svg') {
            $oldFilePath = "../../public/" . $oldRow['Anh'];
            if (file_exists($oldFilePath)) {
                unlink($oldFilePath);
            }
        }

        if (!move_uploaded_file($_FILES['Anh']['tmp_name'], $uploadPath)) {
            throw new Exception("Upload ảnh thất bại");
        }

        $anhPath = "images/" . $fileName; // lưu DB
    } else {
        // Giữ ảnh cũ nếu không upload ảnh mới
        $anhPath = $oldRow['Anh'];
    }

    // Prepare SQL statement
    $sql = "UPDATE DichVu SET TenDV = ?, DonGia = ?, MoTa = ?, Anh = ? WHERE MaDV = ?";
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Lỗi chuẩn bị câu lệnh: " . $conn->error);
    }

    $stmt->bind_param("sssss", 
        $TenDV, 
        $DonGia, 
        $MoTa,     
        $anhPath,
        $MaDV
    );

    if (!$stmt->execute()) {
        throw new Exception("Lỗi thực thi câu lệnh: " . $stmt->error);
    }

    if ($stmt->affected_rows === 0) {
        throw new Exception("Không có thay đổi nào được thực hiện");
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Cập nhật dịch vụ thành công'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>