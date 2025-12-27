<?php
session_start();
header("Content-Type: application/json");
require __DIR__ . "/../db.php";

$data = json_decode(file_get_contents("php://input"), true);

$fullname = trim($data['fullname'] ?? '');
$username = trim($data['username'] ?? '');
$email    = trim($data['email'] ?? '');
$password = $data['repass'] ?? '';

if (!$fullname || !$username || !$email || !$password) {
    echo json_encode(["success" => false, "message" => "Thiếu thông tin"]);
    exit;
}

// check username trùng
$checkUsername = $conn->prepare("SELECT 1 FROM NguoiDung WHERE TenDN=?");
$checkUsername->bind_param("s", $username);
$checkUsername->execute();
if ($checkUsername->get_result()->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Tên đăng nhập đã tồn tại"]);
    exit;
}

// check email trùng
$check = $conn->prepare("SELECT 1 FROM NguoiDung WHERE Email=?");
$check->bind_param("s", $email);
$check->execute();
if ($check->get_result()->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Email đã tồn tại"]);
    exit;
}

// lấy mã ND lớn nhất
$sql = "SELECT MaND FROM NguoiDung ORDER BY MaND DESC LIMIT 1";
$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $num = intval(substr($row['MaND'], 2));
    $newNum = $num + 1;
} else {
    $newNum = 1;
}

$maND = 'ND' . str_pad($newNum, 3, '0', STR_PAD_LEFT);

$avatar = null; // Default avatar will be handled by get_avatar.php

$stmt = $conn->prepare(
  "INSERT INTO NguoiDung (MaND, TenDN, HoTen, Email, MatKhau)
   VALUES (?, ?, ?, ?, ?)"
);
$stmt->bind_param("sssss", $maND, $username, $fullname, $email, $password);

// Debug logging
error_log("Register Debug - MaND: $maND, TenDN: $username, HoTen: $fullname, Email: $email");

if ($stmt->execute()) {
    // Không tự động đăng nhập, user phải đăng nhập thủ công
    
    echo json_encode([
        "success" => true,
        "message" => "Đăng ký thành công",
        "username" => $username,
        "user" => [
            "MaND" => $maND,
            "HoTen" => $fullname,
            "Email" => $email,
            "QuyenHan" => "Khách hàng"
        ]
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Lỗi thêm user"
    ]);
}

$stmt->close();
$conn->close();
?>
