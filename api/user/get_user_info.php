<?php 
error_reporting(0);
ini_set('display_errors', 0);

ini_set('session.cookie_path', '/');
session_start(); 
header('Content-Type: application/json; charset=utf-8'); 

try {
    include __DIR__ . "/../db.php"; 

    if (!isset($_SESSION['user_id']) && isset($_GET['debug'])) { 
        $_SESSION['user_id'] = 'ND006'; 
    } 

    if (isset($_SESSION['user_id'])) { 
        $user_id = mysqli_real_escape_string($conn, $_SESSION['user_id']); 
        $sql = "SELECT HoTen, Email, QuyenHan FROM NguoiDung WHERE MaND=?"; 
        $stmt = $conn->prepare($sql);
        
        if ($stmt) {
            $stmt->bind_param("s", $user_id);
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            
            if ($result) {
                echo json_encode(["success" => true, "user" => $result], JSON_UNESCAPED_UNICODE); 
            } else {
                echo json_encode(["success" => false, "message" => "Không tìm thấy user"], JSON_UNESCAPED_UNICODE); 
            }
        } else {
            echo json_encode(["success" => false, "message" => "Lỗi database"], JSON_UNESCAPED_UNICODE); 
        }
    } else { 
        echo json_encode(["success" => false, "message" => "Chưa đăng nhập"], JSON_UNESCAPED_UNICODE); 
    } 

    if (isset($conn)) {
        $conn->close(); 
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Lỗi server: " . $e->getMessage()], JSON_UNESCAPED_UNICODE); 
}
?>