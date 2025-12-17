<?php
// Cấu hình session để hoạt động trên toàn bộ domain
ini_set('session.cookie_path', '/');
session_start();

$_SESSION = [];
session_destroy();

header('Content-Type: application/json; charset=utf-8');
echo json_encode(['success' => true]);
?>