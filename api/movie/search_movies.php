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
    // Lấy các tham số tìm kiếm
    $title = isset($_GET['title']) ? trim($_GET['title']) : '';
    $director = isset($_GET['director']) ? trim($_GET['director']) : '';
    $actor = isset($_GET['actor']) ? trim($_GET['actor']) : '';
    $genre = isset($_GET['genre']) ? trim($_GET['genre']) : '';
    $year_from = isset($_GET['year_from']) ? (int)$_GET['year_from'] : null;
    $year_to = isset($_GET['year_to']) ? (int)$_GET['year_to'] : null;
    $rating = isset($_GET['rating']) ? trim($_GET['rating']) : '';
    $format = isset($_GET['format']) ? trim($_GET['format']) : '';
    $language = isset($_GET['language']) ? trim($_GET['language']) : '';
    
    // Xây dựng câu truy vấn SQL
    $sql = "SELECT * FROM Phim WHERE 1=1";
    $conditions = [];
    $params = [];
    $types = "";
    
    // Tìm kiếm theo tên phim
    if (!empty($title)) {
        $conditions[] = "TenPhim LIKE ?";
        $params[] = "%$title%";
        $types .= "s";
    }
    
    // Tìm kiếm theo đạo diễn
    if (!empty($director)) {
        $conditions[] = "DaoDien LIKE ?";
        $params[] = "%$director%";
        $types .= "s";
    }
    
    // Tìm kiếm theo diễn viên
    if (!empty($actor)) {
        $conditions[] = "DienVien LIKE ?";
        $params[] = "%$actor%";
        $types .= "s";
    }
    
    // Tìm kiếm theo thể loại
    if (!empty($genre)) {
        $conditions[] = "TheLoai LIKE ?";
        $params[] = "%$genre%";
        $types .= "s";
    }
    
    // Tìm kiếm theo năm khởi chiếu
    if ($year_from !== null) {
        $conditions[] = "YEAR(NgayKhoiChieu) >= ?";
        $params[] = $year_from;
        $types .= "i";
    }
    
    if ($year_to !== null) {
        $conditions[] = "YEAR(NgayKhoiChieu) <= ?";
        $params[] = $year_to;
        $types .= "i";
    }
    
    // Tìm kiếm theo độ tuổi
    if (!empty($rating)) {
        $conditions[] = "GioiHanTuoi = ?";
        $params[] = $rating;
        $types .= "s";
    }
    
    // Tìm kiếm theo định dạng
    if (!empty($format)) {
        $conditions[] = "DinhDang LIKE ?";
        $params[] = "%$format%";
        $types .= "s";
    }
    
    // Tìm kiếm theo ngôn ngữ
    if (!empty($language)) {
        $conditions[] = "NgonNgu LIKE ?";
        $params[] = "%$language%";
        $types .= "s";
    }
    
    // Thêm điều kiện vào SQL
    if (!empty($conditions)) {
        $sql .= " AND " . implode(" AND ", $conditions);
    }
    
    // Sắp xếp theo ngày khởi chiếu mới nhất
    $sql .= " ORDER BY NgayKhoiChieu DESC";
    
    $stmt = mysqli_prepare($conn, $sql);
    
    if (!empty($params)) {
        mysqli_stmt_bind_param($stmt, $types, ...$params);
    }
    
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $movies = mysqli_fetch_all($result, MYSQLI_ASSOC);
    
    // Format dữ liệu trả về
    $formattedMovies = [];
    foreach ($movies as $movie) {
        $formattedMovies[] = [
            'MaPhim' => $movie['MaPhim'],
            'TenPhim' => $movie['TenPhim'],
            'MoTa' => $movie['MoTa'],
            'GioiHanTuoi' => $movie['GioiHanTuoi'],
            'DinhDang' => $movie['DinhDang'],
            'DaoDien' => $movie['DaoDien'],
            'DienVien' => $movie['DienVien'],
            'TheLoai' => $movie['TheLoai'],
            'NgayKhoiChieu' => $movie['NgayKhoiChieu'],
            'NgonNgu' => $movie['NgonNgu'],
            'Poster' => $movie['Poster'],
            'Banner' => $movie['Banner'],
            'Trailer' => $movie['Trailer'],
            'TrangThai' => $movie['TrangThai'],
            'ThoiLuong' => $movie['ThoiLuong']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $formattedMovies,
        'total' => count($formattedMovies)
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Lỗi: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

mysqli_close($conn);
?>