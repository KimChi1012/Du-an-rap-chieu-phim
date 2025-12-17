<?php
// Cấu hình session để hoạt động trên toàn bộ domain
ini_set('session.cookie_path', '/');
session_start();
include __DIR__ . "/../db.php";

// Nếu chưa đăng nhập thì không xuất ảnh
if (!isset($_SESSION['user_id'])) {
    header("Content-Type: image/png");
    readfile(__DIR__ . "/../../public/images/default-avatar.jpeg");
    exit;
}

$user_id = $_SESSION['user_id'];

$stmt = $conn->prepare("SELECT Avatar FROM NguoiDung WHERE MaND = ?");
$stmt->bind_param("s", $user_id);
$stmt->execute();
$stmt->store_result();
$stmt->bind_result($avatarData);
$stmt->fetch();
$stmt->close();
$conn->close();

if (!empty($avatarData)) {
    // Dùng finfo để phát hiện định dạng file thật sự
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->buffer($avatarData);
    
    // Nếu finfo không xác định được → mặc định PNG
    if (!$mime) $mime = "image/png";
    
    header("Content-Type: $mime");
    echo $avatarData;
} else {
    // Nếu chưa có avatar → dùng ảnh mặc định
    header("Content-Type: image/png");
    readfile(__DIR__ . "/../../public/images/default-avatar.jpeg");
}
?>
