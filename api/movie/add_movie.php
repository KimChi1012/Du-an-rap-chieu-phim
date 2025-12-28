<?php
// Enable error reporting for debugging but don't display errors to prevent breaking JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Start output buffering to catch any unexpected output
ob_start();

header('Content-Type: application/json; charset=utf-8');
include "../db.php";

try {
    // Debug info
    error_log("POST data: " . print_r($_POST, true));
    error_log("FILES data: " . print_r($_FILES, true));
    
    // ✅ LẤY DỮ LIỆU TỪ FORM DATA
    if (empty($_POST)) {
        throw new Exception("Dữ liệu không hợp lệ");
    }

    $MaPhim        = $_POST['MaPhim'] ?? '';
    $TenPhim       = $_POST['TenPhim'] ?? '';
    $MoTa          = $_POST['MoTa'] ?? '';
    $GioiHanTuoi   = $_POST['GioiHanTuoi'] ?? '';
    $DinhDang      = $_POST['DinhDang'] ?? '';
    $DaoDien       = $_POST['DaoDien'] ?? '';
    $DienVien      = $_POST['DienVien'] ?? '';
    $TheLoai       = $_POST['TheLoai'] ?? '';
    $NgayKhoiChieu = $_POST['NgayKhoiChieu'] ?? '';
    $NgonNgu       = $_POST['NgonNgu'] ?? '';
    $Trailer       = $_POST['Trailer'] ?? '';
    $TrangThai     = $_POST['TrangThai'] ?? '';
    $ThoiLuong     = $_POST['ThoiLuong'] ?? '';
    
    // ✅ VALIDATE - Chỉ validate các trường thực sự bắt buộc
    if (empty($TenPhim) || empty($MoTa) || empty($TheLoai) || empty($NgayKhoiChieu) || empty($Trailer) || empty($ThoiLuong) || empty($TrangThai)) {
        throw new Exception("Thiếu dữ liệu bắt buộc: Tên phim, Mô tả, Thể loại, Ngày khởi chiếu, Trailer, Thời lượng, Trạng thái");
    }

    // Validate file uploads
    if (!isset($_FILES['Poster']) || $_FILES['Poster']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception("Vui lòng chọn file poster");
    }
    if (!isset($_FILES['Banner']) || $_FILES['Banner']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception("Vui lòng chọn file banner");
    }

    // ✅ TẠO MaPhim TỰ ĐỘNG THEO FORMAT PH + 3 SỐ
    if (empty($MaPhim)) {
        // Tìm mã phim lớn nhất có format PH + 3 số
        $sql = "SELECT MaPhim FROM Phim WHERE MaPhim LIKE 'PH%' ORDER BY CAST(SUBSTRING(MaPhim, 3) AS UNSIGNED) DESC LIMIT 1";
        $result = $conn->query($sql);
        
        if ($result && $result->num_rows > 0) {
            $lastCode = $result->fetch_assoc()['MaPhim'];
            // Lấy số từ mã cuối cùng (ví dụ: PH001 -> 1)
            $lastNumber = (int)substr($lastCode, 2);
            $nextNumber = $lastNumber + 1;
        } else {
            // Nếu chưa có phim nào, bắt đầu từ 1
            $nextNumber = 1;
        }
        
        // Tạo mã phim mới với 3 chữ số
        $MaPhim = 'PH' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
        
        // Kiểm tra trùng lặp và tạo mã mới nếu cần
        $attempts = 0;
        while ($attempts < 100) { // Giới hạn số lần thử để tránh vòng lặp vô hạn
            $checkSql = "SELECT COUNT(*) as count FROM Phim WHERE MaPhim = ?";
            $checkStmt = $conn->prepare($checkSql);
            $checkStmt->bind_param("s", $MaPhim);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();
            $count = $checkResult->fetch_assoc()['count'];
            
            if ($count == 0) {
                break; // Mã không trùng, sử dụng được
            }
            
            $nextNumber++;
            $MaPhim = 'PH' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
            $attempts++;
        }
    }

    // ✅ XỬ LÝ ẢNH - Lưu trực tiếp vào public/images/
    $imageDir = "../../public/images/";
    
    // Tạo thư mục nếu chưa có
    if (!file_exists($imageDir)) {
        if (!mkdir($imageDir, 0777, true)) {
            throw new Exception("Không thể tạo thư mục images");
        }
    }

    // Lấy số từ mã phim (PH001 -> 1, PH010 -> 10)
    $movieNumber = (int)substr($MaPhim, 2);

    // Poster
    $posterPath = '';
    if (isset($_FILES['Poster']) && $_FILES['Poster']['error'] == UPLOAD_ERR_OK) {
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        $fileType = $_FILES['Poster']['type'];
        if (in_array($fileType, $allowedTypes)) {
            $extension = pathinfo($_FILES['Poster']['name'], PATHINFO_EXTENSION);
            $posterName = 'poster' . $movieNumber . '.' . $extension;
            $posterPath = 'images/' . $posterName;
            if (!move_uploaded_file($_FILES['Poster']['tmp_name'], $imageDir . $posterName)) {
                throw new Exception("Upload poster thất bại");
            }
        } else {
            throw new Exception("File poster không đúng định dạng (chỉ chấp nhận JPG, PNG, GIF)");
        }
    }

    // Banner
    $bannerPath = '';
    if (isset($_FILES['Banner']) && $_FILES['Banner']['error'] == UPLOAD_ERR_OK) {
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        $fileType = $_FILES['Banner']['type'];
        if (in_array($fileType, $allowedTypes)) {
            $extension = pathinfo($_FILES['Banner']['name'], PATHINFO_EXTENSION);
            $bannerName = 'banner' . $movieNumber . '.' . $extension;
            $bannerPath = 'images/' . $bannerName;
            if (!move_uploaded_file($_FILES['Banner']['tmp_name'], $imageDir . $bannerName)) {
                throw new Exception("Upload banner thất bại");
            }
        } else {
            throw new Exception("File banner không đúng định dạng (chỉ chấp nhận JPG, PNG, GIF)");
        }
    }

    // Convert ThoiLuong to integer
    $ThoiLuong = (int)$ThoiLuong;

    // ✅ INSERT - Sử dụng tất cả các trường
    $sql = "INSERT INTO Phim 
    (MaPhim, TenPhim, MoTa, GioiHanTuoi, DinhDang, DaoDien, DienVien, TheLoai, NgayKhoiChieu, NgonNgu, Poster, Banner, Trailer, TrangThai, ThoiLuong)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Lỗi chuẩn bị câu lệnh: " . $conn->error);
    }

    $stmt->bind_param(
        "ssssssssssssssi",
        $MaPhim,
        $TenPhim,
        $MoTa,
        $GioiHanTuoi,
        $DinhDang,
        $DaoDien,
        $DienVien,
        $TheLoai,
        $NgayKhoiChieu,
        $NgonNgu,
        $posterPath,
        $bannerPath,
        $Trailer,
        $TrangThai,
        $ThoiLuong
    );

    if (!$stmt->execute()) {
        throw new Exception("Lỗi thêm phim: " . $stmt->error);
    }

    // Clear any unexpected output before sending JSON
    ob_clean();
    
    echo json_encode([
        'success' => true,
        'message' => 'Thêm phim thành công',
        'movie_id' => $MaPhim
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    // Clear any unexpected output before sending JSON
    ob_clean();
    
    error_log("Add movie error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
} catch (Error $e) {
    // Catch fatal errors too
    ob_clean();
    
    error_log("Add movie fatal error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>