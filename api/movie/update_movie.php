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
    
    if (empty($_POST)) {
        throw new Exception("Dữ liệu không hợp lệ");
    }

    $MaPhim = $_POST['MaPhim'] ?? '';
    if (empty($MaPhim)) {
        throw new Exception("Thiếu mã phim");
    }

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

    // Lấy thông tin phim hiện tại để giữ lại ảnh cũ nếu không upload ảnh mới
    $currentMovie = $conn->query("SELECT Poster, Banner FROM Phim WHERE MaPhim = '$MaPhim'")->fetch_assoc();
    $posterPath = $currentMovie['Poster'] ?? '';
    $bannerPath = $currentMovie['Banner'] ?? '';

    // ✅ XỬ LÝ ẢNH - Lưu trực tiếp vào public/images/
    $imageDir = "../../public/images/";
    
    // Tạo thư mục nếu chưa có
    if (!file_exists($imageDir)) {
        mkdir($imageDir, 0777, true);
    }

    // Lấy số từ mã phim (PH001 -> 1, PH010 -> 10)
    $movieNumber = (int)substr($MaPhim, 2); // Bỏ 2 ký tự đầu (PH) và chuyển thành số

    // Poster - chỉ cập nhật nếu có file mới
    if (isset($_FILES['Poster']) && $_FILES['Poster']['error'] == UPLOAD_ERR_OK) {
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (in_array($_FILES['Poster']['type'], $allowedTypes)) {
            // Xóa ảnh cũ nếu có
            if ($posterPath && file_exists("../../public/" . $posterPath)) {
                unlink("../../public/" . $posterPath);
            }
            
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

    // Banner - chỉ cập nhật nếu có file mới
    if (isset($_FILES['Banner']) && $_FILES['Banner']['error'] == UPLOAD_ERR_OK) {
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (in_array($_FILES['Banner']['type'], $allowedTypes)) {
            // Xóa ảnh cũ nếu có
            if ($bannerPath && file_exists("../../public/" . $bannerPath)) {
                unlink("../../public/" . $bannerPath);
            }
            
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

    // ✅ UPDATE
    $sql = "UPDATE Phim SET 
        TenPhim = ?, MoTa = ?, GioiHanTuoi = ?, DinhDang = ?, DaoDien = ?, DienVien = ?, 
        TheLoai = ?, NgayKhoiChieu = ?, NgonNgu = ?, Poster = ?, Banner = ?, 
        Trailer = ?, TrangThai = ?, ThoiLuong = ?
        WHERE MaPhim = ?";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param(
        "sssssssssssssis",
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
        $ThoiLuong,
        $MaPhim
    );

    if (!$stmt->execute()) {
        throw new Exception("Lỗi cập nhật phim: " . $stmt->error);
    }

    // Clear any unexpected output before sending JSON
    ob_clean();
    
    echo json_encode([
        'success' => true,
        'message' => 'Cập nhật phim thành công'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    // Clear any unexpected output before sending JSON
    ob_clean();
    
    error_log("Update movie error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
} catch (Error $e) {
    // Catch fatal errors too
    ob_clean();
    
    error_log("Update movie fatal error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>