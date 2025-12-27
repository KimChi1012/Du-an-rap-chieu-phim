<?php
// Cấu hình session để hoạt động trên toàn bộ domain
ini_set('session.cookie_path', '/');
ini_set('session.cookie_domain', '');
ini_set('session.cookie_secure', false);
ini_set('session.cookie_httponly', true);
ini_set('session.use_strict_mode', false);

session_start();

ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json");
require __DIR__ . "/../db.php";

$data = json_decode(file_get_contents("php://input"), true);

$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

if (empty($username) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Nhập username và password"]);
    exit;
}

$stmt = $conn->prepare("
    SELECT MaND, TenDN, MatKhau 
    FROM NguoiDung 
    WHERE TenDN = ? OR Email = ?
");
$stmt->bind_param("ss", $username, $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "Sai tài khoản hoặc mật khẩu"]);
    exit;
}

$row = $result->fetch_assoc();

if ($row['MatKhau'] === $password) {
    $_SESSION['user_id'] = $row['MaND'];
    
    // Debug session
    error_log("Login successful - User ID: " . $row['MaND']);
    error_log("Session ID: " . session_id());
    error_log("Session user_id set to: " . $_SESSION['user_id']);

    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => "Sai tài khoản hoặc mật khẩu"]);
}

$stmt->close();
$conn->close();
