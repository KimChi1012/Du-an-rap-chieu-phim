<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Chỉ chấp nhận POST request'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $maqc  = $_POST['MaQC'] ?? '';
    $tenqc = trim($_POST['TenQC'] ?? '');
    $link  = isset($_POST['Link']) && trim($_POST['Link']) !== '' ? trim($_POST['Link']) : null;

    if (empty($maqc) || empty($tenqc)) {
        echo json_encode(['success' => false, 'error' => 'Thiếu thông tin bắt buộc'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Sửa: dùng bảng quangcao thay vì Banner
    $checkSql = "SELECT Banner FROM quangcao WHERE MaQC = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("s", $maqc);
    $checkStmt->execute();
    $result = $checkStmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'error' => 'Không tìm thấy banner'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $oldData = $result->fetch_assoc();
    $oldBannerPath = $oldData['Banner'];

    $newBannerPath = $oldBannerPath;

    if (isset($_FILES['Banner']) && $_FILES['Banner']['error'] === UPLOAD_ERR_OK) {
        // Tìm kiếm trong bảng Phim để lấy tên banner dựa vào tên quảng cáo
        $searchSql = "SELECT Banner FROM Phim WHERE TenPhim LIKE ? LIMIT 1";
        $searchStmt = $conn->prepare($searchSql);
        $searchTerm = "%" . $tenqc . "%";
        $searchStmt->bind_param("s", $searchTerm);
        $searchStmt->execute();
        $searchResult = $searchStmt->get_result();
        
        $targetFileName = null;
        if ($searchResult && $row = $searchResult->fetch_assoc()) {
            // Lấy tên file từ bảng Phim
            $movieBanner = $row['Banner'];
            if (!empty($movieBanner)) {
                // Lấy tên file từ đường dẫn (bỏ thư mục)
                $targetFileName = basename($movieBanner);
                error_log("Update - Found matching movie banner: " . $movieBanner);
            }
        }
        
        // Nếu không tìm thấy trong bảng Phim, giữ nguyên ảnh cũ hoặc tạo tên mới
        if (!$targetFileName) {
            // Nếu có ảnh cũ, giữ nguyên tên file cũ
            if (!empty($oldBannerPath)) {
                $targetFileName = basename($oldBannerPath);
                error_log("Update - Keeping old filename: " . $targetFileName);
            } else {
                // Tạo tên file mới nếu không có ảnh cũ
                $fileExt = strtolower(pathinfo($_FILES['Banner']['name'], PATHINFO_EXTENSION));
                $targetFileName = "banner_" . time() . "_" . uniqid() . "." . $fileExt;
                error_log("Update - No old file, using generated name: " . $targetFileName);
            }
        }

        // Đường dẫn tuyệt đối đến thư mục images
        $uploadDir = __DIR__ . "/../../public/images/";
        
        // Debug
        error_log("Update - Upload directory: " . $uploadDir);
        error_log("Update - Target filename: " . $targetFileName);
        
        // Tạo thư mục nếu chưa có
        if (!is_dir($uploadDir)) {
            if (!mkdir($uploadDir, 0755, true)) {
                echo json_encode(['success' => false, 'error' => 'Không thể tạo thư mục upload'], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }

        // Kiểm tra định dạng file
        $fileExt = strtolower(pathinfo($_FILES['Banner']['name'], PATHINFO_EXTENSION));
        $allowExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        if (!in_array($fileExt, $allowExt)) {
            echo json_encode(['success' => false, 'error' => 'Định dạng ảnh không hợp lệ'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $fullPath = $uploadDir . $targetFileName;
        
        error_log("Update - Full path: " . $fullPath);

        if (!move_uploaded_file($_FILES['Banner']['tmp_name'], $fullPath)) {
            $error = error_get_last();
            echo json_encode(['success' => false, 'error' => 'Upload thất bại: ' . ($error['message'] ?? 'Không xác định')], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Không xóa ảnh cũ - chỉ ghi đè
        // Lý do: Ảnh đổi rồi thì không cần lưu ảnh cũ làm gì

        // ✅ ĐƯỜNG DẪN LƯU VÀO CSDL
        $newBannerPath = "images/" . $targetFileName;
        error_log("Update - Banner path saved: " . $newBannerPath);
    }

    // Cập nhật vào bảng quangcao
    $sql = "UPDATE quangcao SET TenQC = ?, Banner = ?, Link = ? WHERE MaQC = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssss", $tenqc, $newBannerPath, $link, $maqc);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Cập nhật thành công'], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['success' => false, 'error' => 'Lỗi cập nhật'], JSON_UNESCAPED_UNICODE);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>