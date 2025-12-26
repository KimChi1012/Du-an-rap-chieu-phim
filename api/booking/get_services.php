<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../db.php';

try {
    $query = "
        SELECT 
            MaDV as MaDichVu,
            TenDV as TenDichVu,
            MoTa,
            DonGia as Gia,
            Anh as HinhAnh
        FROM DichVu 
        ORDER BY TenDV ASC
    ";
    
    $result = mysqli_query($conn, $query);
    
    if (!$result) {
        throw new Exception('Lỗi truy vấn: ' . mysqli_error($conn));
    }
    
    $services = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $row['Gia'] = (float) $row['Gia'];
        
        if ($row['HinhAnh'] && !empty($row['HinhAnh'])) {
            if (strpos($row['HinhAnh'], 'http') !== 0 && strpos($row['HinhAnh'], '/') !== 0) {
                $row['HinhAnh'] = $row['HinhAnh'];
            }
        } else {
            $row['HinhAnh'] = 'images/default-service.jpg';
        }
        
        $services[] = $row;
    }
    
    echo json_encode([
        'success' => true,
        'services' => $services,
        'count' => count($services)
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Lỗi hệ thống: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

mysqli_close($conn);
?>