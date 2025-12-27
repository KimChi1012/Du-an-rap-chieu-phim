<?php
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

ob_start();

try {
    include '../db.php';
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Method not allowed"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['userId'])) {
        echo json_encode(["success" => false, "message" => "Thiếu thông tin userId"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $userId = $input['userId'];
    $password = isset($input['password']) ? $input['password'] : null;

    if (!$conn) {
        echo json_encode(["success" => false, "message" => "Lỗi kết nối database"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $conn->prepare("SELECT MaND, HoTen, MatKhau FROM NguoiDung WHERE MaND = ?");
    
    if (!$stmt) {
        echo json_encode(["success" => false, "message" => "Lỗi prepare statement"], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    $stmt->bind_param("s", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Người dùng không tồn tại"], JSON_UNESCAPED_UNICODE);
        $stmt->close();
        $conn->close();
        exit;
    }
    
    $user = $result->fetch_assoc();
    $stmt->close();

    if ($password !== null) {
        if ($user['MatKhau'] === $password) {
            echo json_encode([
                "success" => true, 
                "message" => "Mật khẩu chính xác",
                "data" => [
                    "userId" => $user['MaND'],
                    "userName" => $user['HoTen']
                ]
            ], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode(["success" => false, "message" => "Mật khẩu không chính xác"], JSON_UNESCAPED_UNICODE);
        }
    } else {
        echo json_encode([
            "success" => true, 
            "message" => "Người dùng hợp lệ",
            "data" => [
                "userId" => $user['MaND'],
                "userName" => $user['HoTen']
            ]
        ], JSON_UNESCAPED_UNICODE);
    }
    
    $conn->close();
    
} catch (Exception $e) {
    ob_clean();
    echo json_encode(["success" => false, "message" => "Lỗi server: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
} catch (Error $e) {
    ob_clean();
    echo json_encode(["success" => false, "message" => "Lỗi PHP: " . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}

ob_end_flush();
?>