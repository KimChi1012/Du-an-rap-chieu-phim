<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

try {
    // Lấy tham số từ GET request
    $action = $_GET['action'] ?? 'total';
    $type = $_GET['type'] ?? 'total';
    $date = $_GET['date'] ?? date('Y-m-d');
    $month = $_GET['month'] ?? date('Y-m');
    $year = $_GET['year'] ?? date('Y');

    $revenue_data = [];

    switch ($action) {
        case 'stats':
            // Thống kê tổng quan
            $stats = [];
            
            // Tổng doanh thu
            $sql = "SELECT SUM(TongTien) as total_revenue FROM HoaDon";
            $result = $conn->query($sql);
            $stats['total_revenue'] = $result->fetch_assoc()['total_revenue'] ?? 0;
            
            // Doanh thu hôm nay
            $sql = "SELECT SUM(TongTien) as today_revenue FROM HoaDon WHERE DATE(NgayLap) = CURDATE()";
            $result = $conn->query($sql);
            $stats['today_revenue'] = $result->fetch_assoc()['today_revenue'] ?? 0;
            
            // Doanh thu tháng này
            $sql = "SELECT SUM(TongTien) as month_revenue FROM HoaDon WHERE YEAR(NgayLap) = YEAR(CURDATE()) AND MONTH(NgayLap) = MONTH(CURDATE())";
            $result = $conn->query($sql);
            $stats['month_revenue'] = $result->fetch_assoc()['month_revenue'] ?? 0;
            
            // Tổng số hóa đơn
            $sql = "SELECT COUNT(*) as total_invoices FROM HoaDon";
            $result = $conn->query($sql);
            $stats['total_invoices'] = $result->fetch_assoc()['total_invoices'] ?? 0;
            
            $revenue_data = $stats;
            break;

        case 'top_invoices':
            // Top 5 hóa đơn cao nhất
            $sql = "SELECT DISTINCT
                hd.MaHD,
                hd.TongTien,
                hd.NgayLap as NgayTao,
                nd.HoTen,
                nd.Email,
                COALESCE(
                    (SELECT p.TenPhim 
                     FROM CTHDVe ct2 
                     LEFT JOIN SuatChieu sc ON ct2.MaSuat = sc.MaSuat 
                     LEFT JOIN Phim p ON sc.MaPhim = p.MaPhim 
                     WHERE ct2.MaHD = hd.MaHD 
                     LIMIT 1),
                    'Chỉ dịch vụ'
                ) as TenPhim
            FROM HoaDon hd
            LEFT JOIN NguoiDung nd ON hd.MaND = nd.MaND
            ORDER BY hd.TongTien DESC
            LIMIT 5";
            
            $result = $conn->query($sql);
            if (!$result) {
                throw new Exception("Lỗi SQL: " . $conn->error);
            }
            
            $revenue_data = [];
            while ($row = $result->fetch_assoc()) {
                $revenue_data[] = $row;
            }
            break;

        case 'filtered':
            // Dữ liệu lọc theo loại báo cáo
            switch ($type) {
                case 'daily':
                    // Doanh thu tất cả các ngày trong tháng
                    $target_month = $month ?: date('Y-m');
                    $sql = "SELECT 
                        DATE(NgayLap) as date,
                        SUM(TongTien) as revenue
                    FROM HoaDon 
                    WHERE DATE_FORMAT(NgayLap, '%Y-%m') = ?
                    GROUP BY DATE(NgayLap)
                    ORDER BY DATE(NgayLap)";
                    
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("s", $target_month);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    
                    $revenue_data = [];
                    while ($row = $result->fetch_assoc()) {
                        $revenue_data[] = $row;
                    }
                    break;

                case 'monthly':
                    // Doanh thu tất cả các tháng trong năm
                    $target_year = $year ?: date('Y');
                    $sql = "SELECT 
                        MONTH(NgayLap) as month,
                        SUM(TongTien) as revenue
                    FROM HoaDon 
                    WHERE YEAR(NgayLap) = ?
                    GROUP BY MONTH(NgayLap)
                    ORDER BY MONTH(NgayLap)";
                    
                    $stmt = $conn->prepare($sql);
                    $stmt->bind_param("i", $target_year);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    
                    $revenue_data = [];
                    while ($row = $result->fetch_assoc()) {
                        $revenue_data[] = $row;
                    }
                    break;

                case 'yearly':
                    // Doanh thu tất cả các năm có dữ liệu
                    $sql = "SELECT 
                        YEAR(NgayLap) as year,
                        SUM(TongTien) as revenue
                    FROM HoaDon 
                    GROUP BY YEAR(NgayLap)
                    ORDER BY YEAR(NgayLap) DESC";
                    
                    $result = $conn->query($sql);
                    $revenue_data = [];
                    while ($row = $result->fetch_assoc()) {
                        $revenue_data[] = $row;
                    }
                    break;
            }
            break;

        case 'total':
        default:
            // Tổng doanh thu tất cả (backward compatibility)
            $sql = "SELECT 
                COUNT(*) as total_invoices,
                SUM(TongTien) as total_revenue,
                AVG(TongTien) as avg_revenue,
                MIN(TongTien) as min_revenue,
                MAX(TongTien) as max_revenue
            FROM HoaDon";
            
            $result = $conn->query($sql);
            $revenue_data = $result->fetch_assoc();
            break;
    }

    echo json_encode([
        'success' => true,
        'action' => $action,
        'data' => $revenue_data
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>