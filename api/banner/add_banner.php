<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Chỉ chấp nhận POST request'], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $tenqc = trim($_POST['TenQC'] ?? '');
    $link  = isset($_POST['Link']) && trim($_POST['Link']) !== '' ? trim($_POST['Link']) : null;

    if (empty($tenqc)) {
        echo json_encode(['success' => false, 'error' => 'Vui lòng nhập tên quảng cáo'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // ===== XỬ LÝ UPLOAD ẢNH =====
    $bannerPath = ''; // Để chuỗi rỗng thay vì null

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
                error_log("Found matching movie banner: " . $movieBanner);
            }
        }
        
        // Nếu không tìm thấy trong bảng Phim, tạo tên file mới
        if (!$targetFileName) {
            $fileExt = strtolower(pathinfo($_FILES['Banner']['name'], PATHINFO_EXTENSION));
            $targetFileName = "banner_" . time() . "_" . uniqid() . "." . $fileExt;
            error_log("No matching movie found, using generated name: " . $targetFileName);
        }

        // Đường dẫn tuyệt đối đến thư mục images
        $uploadDir = __DIR__ . "/../../public/images/";
        
        // Debug: Hiển thị đường dẫn
        error_log("Upload directory: " . $uploadDir);
        error_log("Target filename: " . $targetFileName);

        // Tạo thư mục nếu chưa có
        if (!is_dir($uploadDir)) {
            if (!mkdir($uploadDir, 0755, true)) {
                echo json_encode(['success' => false, 'error' => 'Không thể tạo thư mục upload: ' . $uploadDir], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }

        // Kiểm tra định dạng file
        $fileExt = strtolower(pathinfo($_FILES['Banner']['name'], PATHINFO_EXTENSION));
        $allowExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        if (!in_array($fileExt, $allowExt)) {
            echo json_encode(['success' => false, 'error' => 'Chỉ cho phép jpg, jpeg, png, webp, gif'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $fullPath = $uploadDir . $targetFileName;
        
        // Debug: Hiển thị thông tin file
        error_log("Full path: " . $fullPath);
        error_log("Temp file: " . $_FILES['Banner']['tmp_name']);

        if (!move_uploaded_file($_FILES['Banner']['tmp_name'], $fullPath)) {
            $error = error_get_last();
            echo json_encode(['success' => false, 'error' => 'Upload ảnh thất bại. Lỗi: ' . ($error['message'] ?? 'Không xác định')], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Kiểm tra file đã được tạo chưa
        if (!file_exists($fullPath)) {
            echo json_encode(['success' => false, 'error' => 'File không được tạo sau khi upload'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // ✅ ĐƯỜNG DẪN LƯU VÀO CSDL: chỉ từ thư mục images trở đi
        $bannerPath = "images/" . $targetFileName;
        
        error_log("Banner path saved to DB: " . $bannerPath);
    } else {
        // Debug: Kiểm tra lỗi upload
        if (isset($_FILES['Banner'])) {
            $uploadError = $_FILES['Banner']['error'];
            $errorMessages = [
                UPLOAD_ERR_INI_SIZE => 'File quá lớn (php.ini)',
                UPLOAD_ERR_FORM_SIZE => 'File quá lớn (form)',
                UPLOAD_ERR_PARTIAL => 'Upload không hoàn tất',
                UPLOAD_ERR_NO_FILE => 'Không có file được chọn',
                UPLOAD_ERR_NO_TMP_DIR => 'Không có thư mục tạm',
                UPLOAD_ERR_CANT_WRITE => 'Không thể ghi file',
                UPLOAD_ERR_EXTENSION => 'Extension chặn upload'
            ];
            
            error_log("Upload error code: " . $uploadError);
            
            if ($uploadError !== UPLOAD_ERR_NO_FILE) {
                echo json_encode(['success' => false, 'error' => 'Lỗi upload: ' . ($errorMessages[$uploadError] ?? 'Lỗi không xác định')], JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
    }

    // ===== SINH MÃ QC =====
    $sqlMax = "SELECT MaQC FROM quangcao ORDER BY MaQC DESC LIMIT 1";
    $result = $conn->query($sqlMax);

    $number = 1;
    if ($result && $row = $result->fetch_assoc()) {
        $number = intval(substr($row['MaQC'], 2)) + 1;
    }
    $maqc = 'QC' . str_pad($number, 3, '0', STR_PAD_LEFT);

    // ===== THÊM VÀO DB =====
    $sql = "INSERT INTO quangcao (MaQC, TenQC, Banner, Link) VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssss", $maqc, $tenqc, $bannerPath, $link);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Thêm banner thành công',
            'MaQC' => $maqc,
            'debug' => [
                'bannerPath' => $bannerPath,
                'hasFile' => isset($_FILES['Banner']),
                'fileError' => $_FILES['Banner']['error'] ?? 'N/A'
            ]
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['success' => false, 'error' => 'Lỗi INSERT: ' . $stmt->error], JSON_UNESCAPED_UNICODE);
    }

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Lỗi hệ thống: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
?>