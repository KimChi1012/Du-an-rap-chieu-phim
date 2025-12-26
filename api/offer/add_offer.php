<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

try {
    if (empty($_POST)) {
        throw new Exception("Dữ liệu không hợp lệ");
    }

    $MaUD        = $_POST['MaUD'] ?? '';
    $TenUD       = $_POST['TenUD'] ?? '';
    $MoTa        = $_POST['MoTa'] ?? '';
    $NgayBatDau  = $_POST['NgayBatDau'] ?? '';
    $NgayKetThuc = $_POST['NgayKetThuc'] ?? '';

    if ($TenUD == '' || $MoTa == '' || $NgayBatDau == '' || $NgayKetThuc == '') {
        throw new Exception("Thiếu dữ liệu bắt buộc");
    }

    if ($MaUD == '') {
        throw new Exception("Vui lòng nhập mã ưu đãi");
    }


    $check = $conn->prepare("SELECT 1 FROM UuDai WHERE MaUD = ?");
    $check->bind_param("s", $MaUD);
    $check->execute();
    $check->store_result();

    if ($check->num_rows > 0) {
        throw new Exception("Mã ưu đãi đã tồn tại");
    }

    if (!isset($_FILES['Anh']) || $_FILES['Anh']['error'] != 0) {
        throw new Exception("Ảnh là bắt buộc");
    }

    $fileExtension = strtolower(pathinfo($_FILES['Anh']['name'], PATHINFO_EXTENSION));

    $fileName = strtolower($MaUD) . '.' . $fileExtension;

    $uploadDir = "../../public/images/";
    
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $uploadPath = $uploadDir . $fileName;

    if (!move_uploaded_file($_FILES['Anh']['tmp_name'], $uploadPath)) {
        throw new Exception("Upload ảnh thất bại");
    }

    $imagePath = "images/" . $fileName;

    $sql = "INSERT INTO UuDai (MaUD, TenUD, MoTa, NgayBatDau, NgayKetThuc, Anh)
        VALUES (?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param("ssssss",
        $MaUD,
        $TenUD,
        $MoTa,
        $NgayBatDau,
        $NgayKetThuc,
        $imagePath
    );

    if (!$stmt->execute()) {
    throw new Exception($stmt->error);
    }


    echo json_encode([
        'success' => true,
        'message' => 'Thêm ưu đãi thành công'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
