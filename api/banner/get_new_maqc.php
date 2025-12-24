<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../db.php';

if (!isset($conn)) {
    echo json_encode([
        'success' => false,
        'error' => 'Không có kết nối DB'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$sql = "SELECT MaQC FROM quangcao ORDER BY MaQC DESC LIMIT 1";
$result = $conn->query($sql);

if ($result && $row = $result->fetch_assoc()) {
    $last = $row['MaQC']; // QC007
    $num = intval(substr($last, 2)) + 1;
} else {
    $num = 1;
}

$newMaQC = 'QC' . str_pad($num, 3, '0', STR_PAD_LEFT);

echo json_encode([
    'success' => true,
    'MaQC' => $newMaQC
], JSON_UNESCAPED_UNICODE);
?>