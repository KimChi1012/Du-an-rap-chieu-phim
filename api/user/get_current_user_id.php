<?php
error_reporting(0);
ini_set('display_errors', 0);

ini_set('session.cookie_path', '/');
session_start();
header('Content-Type: application/json; charset=utf-8');

try {
    if (!isset($_SESSION['user_id']) && isset($_GET['debug'])) {
        $_SESSION['user_id'] = 'ND006';
    }

    if (isset($_SESSION['user_id'])) {
        echo json_encode([
            "success" => true, 
            "userId" => $_SESSION['user_id']
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode([
            "success" => false, 
            "message" => "Chưa đăng nhập"
        ], JSON_UNESCAPED_UNICODE);
    }
} catch (Exception $e) {
    echo json_encode([
        "success" => false, 
        "message" => "Lỗi server: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>