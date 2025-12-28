<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

try {
    // Thống kê tổng quan
    $overview_sql = "SELECT 
        COUNT(*) as total_invoices,
        SUM(TongTien) as total_revenue,
        AVG(TongTien) as avg_invoice_value,
        MIN(TongTien) as min_invoice_value,
        MAX(TongTien) as max_invoice_value
    FROM HoaDon";
    
    $overview_result = $conn->query($overview_sql);
    $overview = $overview_result->fetch_assoc();

    // Doanh thu hôm nay
    $today_sql = "SELECT 
        COUNT(*) as today_invoices,
        COALESCE(SUM(TongTien), 0) as today_revenue
    FROM HoaDon 
    WHERE DATE(NgayLap) = CURDATE()";
    
    $today_result = $conn->query($today_sql);
    $today = $today_result->fetch_assoc();

    // Doanh thu tháng này
    $month_sql = "SELECT 
        COUNT(*) as month_invoices,
        COALESCE(SUM(TongTien), 0) as month_revenue
    FROM HoaDon 
    WHERE YEAR(NgayLap) = YEAR(CURDATE()) 
    AND MONTH(NgayLap) = MONTH(CURDATE())";
    
    $month_result = $conn->query($month_sql);
    $month = $month_result->fetch_assoc();

    // Doanh thu năm này
    $year_sql = "SELECT 
        COUNT(*) as year_invoices,
        COALESCE(SUM(TongTien), 0) as year_revenue
    FROM HoaDon 
    WHERE YEAR(NgayLap) = YEAR(CURDATE())";
    
    $year_result = $conn->query($year_sql);
    $year = $year_result->fetch_assoc();

    // Top 5 hóa đơn có giá trị cao nhất
    $top_invoices_sql = "SELECT 
        MaHD, MaND, NgayLap, TongTien
    FROM HoaDon 
    ORDER BY TongTien DESC 
    LIMIT 5";
    
    $top_result = $conn->query($top_invoices_sql);
    $top_invoices = [];
    while ($row = $top_result->fetch_assoc()) {
        $top_invoices[] = $row;
    }

    // Doanh thu theo tháng trong năm hiện tại
    $monthly_chart_sql = "SELECT 
        MONTH(NgayLap) as month,
        MONTHNAME(NgayLap) as month_name,
        COUNT(*) as invoices_count,
        SUM(TongTien) as revenue
    FROM HoaDon 
    WHERE YEAR(NgayLap) = YEAR(CURDATE())
    GROUP BY MONTH(NgayLap), MONTHNAME(NgayLap)
    ORDER BY MONTH(NgayLap)";
    
    $monthly_result = $conn->query($monthly_chart_sql);
    $monthly_chart = [];
    while ($row = $monthly_result->fetch_assoc()) {
        $monthly_chart[] = $row;
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'overview' => $overview,
            'today' => $today,
            'this_month' => $month,
            'this_year' => $year,
            'top_invoices' => $top_invoices,
            'monthly_chart' => $monthly_chart
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>