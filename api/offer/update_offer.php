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

    if ($MaUD == '' || $TenUD == '' || $MoTa == '' || $NgayBatDau == '' || $NgayKetThuc == '') {
        throw new Exception("Vui lòng nhập đầy đủ thông tin");
    }

    $startDate = new DateTime($NgayBatDau);
    $endDate   = new DateTime($NgayKetThuc);

    if ($endDate <= $startDate) {
        throw new Exception("Ngày kết thúc phải sau ngày bắt đầu");
    }

    $check = $conn->prepare("SELECT Anh FROM UuDai WHERE MaUD = ?");
    $check->bind_param("s", $MaUD);
    $check->execute();
    $result = $check->get_result();

    if ($result->num_rows === 0) {
        throw new Exception("Không tìm thấy ưu đãi");
    }

    $row = $result->fetch_assoc();
    $anhCu = $row['Anh'];

    $anhMoi = $anhCu;

    if (isset($_FILES['Anh']) && $_FILES['Anh']['error'] === 0) {

        $uploadDir = "../../public/images/";
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $fileExtension = strtolower(pathinfo($_FILES['Anh']['name'], PATHINFO_EXTENSION));

        $fileName = strtolower($MaUD) . '.' . $fileExtension;
        $uploadPath = $uploadDir . $fileName;

        if (!move_uploaded_file($_FILES['Anh']['tmp_name'], $uploadPath)) {
            throw new Exception("Upload ảnh thất bại");
        }

        $anhMoi = "images/" . $fileName;
    }

    $sql = "UPDATE UuDai 
            SET TenUD = ?, MoTa = ?, NgayBatDau = ?, NgayKetThuc = ?, Anh = ?
            WHERE MaUD = ?";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("Lỗi prepare: " . $conn->error);
    }

    $stmt->bind_param(
        "ssssss",
        $TenUD,
        $MoTa,
        $NgayBatDau,
        $NgayKetThuc,
        $anhMoi,
        $MaUD
    );

    if (!$stmt->execute()) {
        throw new Exception("Lỗi cập nhật: " . $stmt->error);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Cập nhật ưu đãi thành công'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
