<?php
header('Content-Type: application/json; charset=utf-8');
include "../db.php";

function createSlug($title) {
    $slug = mb_strtolower($title, 'UTF-8');

    $vietnamese = array(
        'à', 'á', 'ạ', 'ả', 'ã', 'â', 'ầ', 'ấ', 'ậ', 'ẩ', 'ẫ', 'ă', 'ằ', 'ắ', 'ặ', 'ẳ', 'ẵ',
        'À', 'Á', 'Ạ', 'Ả', 'Ã', 'Â', 'Ầ', 'Ấ', 'Ậ', 'Ẩ', 'Ẫ', 'Ă', 'Ằ', 'Ắ', 'Ặ', 'Ẳ', 'Ẵ',
        'è', 'é', 'ẹ', 'ẻ', 'ẽ', 'ê', 'ề', 'ế', 'ệ', 'ể', 'ễ',
        'È', 'É', 'Ẹ', 'Ẻ', 'Ẽ', 'Ê', 'Ề', 'Ế', 'Ệ', 'Ể', 'Ễ',
        'ì', 'í', 'ị', 'ỉ', 'ĩ', 'Ì', 'Í', 'Ị', 'Ỉ', 'Ĩ',
        'ò', 'ó', 'ọ', 'ỏ', 'õ', 'ô', 'ồ', 'ố', 'ộ', 'ổ', 'ỗ', 'ơ', 'ờ', 'ớ', 'ợ', 'ở', 'ỡ',
        'Ò', 'Ó', 'Ọ', 'Ỏ', 'Õ', 'Ô', 'Ồ', 'Ố', 'Ộ', 'Ổ', 'Ỗ', 'Ơ', 'Ờ', 'Ớ', 'Ợ', 'Ở', 'Ỡ',
        'ù', 'ú', 'ụ', 'ủ', 'ũ', 'ư', 'ừ', 'ứ', 'ự', 'ử', 'ữ',
        'Ù', 'Ú', 'Ụ', 'Ủ', 'Ũ', 'Ư', 'Ừ', 'Ứ', 'Ự', 'Ử', 'Ữ',
        'ỳ', 'ý', 'ỵ', 'ỷ', 'ỹ', 'Ỳ', 'Ý', 'Ỵ', 'Ỷ', 'Ỹ',
        'đ', 'Đ'
    );
    $english = array(
        'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a',
        'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a',
        'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e',
        'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e', 'e',
        'i', 'i', 'i', 'i', 'i', 'i', 'i', 'i', 'i', 'i',
        'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o',
        'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o', 'o',
        'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u',
        'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u', 'u',
        'y', 'y', 'y', 'y', 'y', 'y', 'y', 'y', 'y', 'y',
        'd', 'd'
    );
    $slug = str_replace($vietnamese, $english, $slug);

    $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
    $slug = preg_replace('/[\s-]+/', '-', $slug);
    $slug = trim($slug, '-');
    
    return $slug;
}

$movieId = null;
$movieTitle = null;

if (isset($_GET['id']) && !empty($_GET['id'])) {
    $movieId = mysqli_real_escape_string($conn, $_GET['id']);
} elseif (isset($_GET['title']) && !empty($_GET['title'])) {
    $movieTitle = mysqli_real_escape_string($conn, $_GET['title']);
} else {
    echo json_encode(["error" => "Thiếu ID hoặc tên phim"], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($movieId) {
    $sql = "SELECT * FROM Phim WHERE MaPhim = '$movieId'";
} else {
    $sql = "SELECT * FROM Phim";
}

$result = mysqli_query($conn, $sql);

if (!$result) {
    echo json_encode(["error" => "Lỗi truy vấn database"], JSON_UNESCAPED_UNICODE);
    exit;
}

$movie = null;

if ($movieId) {
    if (mysqli_num_rows($result) == 0) {
        echo json_encode(["error" => "Không tìm thấy phim"], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $movie = mysqli_fetch_assoc($result);
} else {
    $foundMovies = [];
    $incomingSlug = $movieTitle ? createSlug($movieTitle) : null;

    $debugInfo['incoming_title'] = $movieTitle;
    $debugInfo['incoming_slug'] = $incomingSlug;

    while ($row = mysqli_fetch_assoc($result)) {
        $slug = createSlug($row['TenPhim']);
        $foundMovies[] = [
            'title' => $row['TenPhim'],
            'slug' => $slug,
            'id' => $row['MaPhim']
        ];

        if ($incomingSlug && $slug === $incomingSlug) {
            $movie = $row;
            break;
        }

        if ($movieTitle && mb_strtolower($row['TenPhim'], 'UTF-8') === mb_strtolower($movieTitle, 'UTF-8')) {
            $movie = $row;
            break;
        }
    }

    if (!$movie && $movieTitle) {
        $likeQuery = "SELECT * FROM Phim WHERE TenPhim LIKE '%" . mysqli_real_escape_string($conn, $movieTitle) . "%' LIMIT 1";
        $likeResult = mysqli_query($conn, $likeQuery);
        if ($likeResult && mysqli_num_rows($likeResult) > 0) {
            $movie = mysqli_fetch_assoc($likeResult);
            $foundFallback = true;

            $debugInfo['fallback_like'] = true;
            $debugInfo['fallback_matched'] = $movie['TenPhim'];
        }
    }

    if (!$movie) {
        echo json_encode([
            "error" => "Không tìm thấy phim với slug/title: $movieTitle",
            "debug" => [
                "incoming_title" => $movieTitle,
                "incoming_slug" => $incomingSlug,
                "available_movies" => array_slice($foundMovies, 0, 6)
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

$movieId = $movie['MaPhim'];

$dateFilter = "";
$debugInfo = [];

if (isset($_GET['date']) && !empty($_GET['date'])) {
    $selectedDate = mysqli_real_escape_string($conn, $_GET['date']);
    
    $dateFilter = "AND (sc.NgayChieu = '$selectedDate' OR DATE(sc.NgayChieu) = '$selectedDate')";
    
    $debugInfo['selected_date'] = $selectedDate;
    $debugInfo['date_filter'] = $dateFilter;
    
    $checkDatesSQL = "SELECT DISTINCT sc.NgayChieu FROM SuatChieu sc WHERE sc.MaPhim = '$movieId' ORDER BY sc.NgayChieu";
    $checkDatesResult = mysqli_query($conn, $checkDatesSQL);
    $existingDates = [];
    if ($checkDatesResult) {
        while ($dateRow = mysqli_fetch_assoc($checkDatesResult)) {
            $existingDates[] = $dateRow['NgayChieu'];
        }
    }
    $debugInfo['existing_dates'] = $existingDates;
} else {
    $dateFilter = "AND sc.NgayChieu >= CURDATE()";
    $debugInfo['using_default_filter'] = true;
}

$sqlShowtimes = "SELECT sc.* 
                 FROM SuatChieu sc  
                 WHERE sc.MaPhim = '$movieId' 
                 $dateFilter
                 ORDER BY sc.NgayChieu, sc.GioBatDau";

$debugInfo['sql_query'] = $sqlShowtimes;
$showtimesResult = mysqli_query($conn, $sqlShowtimes);

$showtimes = [];
if ($showtimesResult) {
    while ($row = mysqli_fetch_assoc($showtimesResult)) {
        $showtimes[] = $row;
    }
}

$relatedMovies = [];
$relatedConditions = [];

if (!empty($movie['DaoDien'])) {
    $directors = explode(',', $movie['DaoDien']);
    $directorConditions = [];
    foreach ($directors as $director) {
        $director = trim($director);
        if (!empty($director)) {
            $directorConditions[] = "DaoDien LIKE '%" . mysqli_real_escape_string($conn, $director) . "%'";
        }
    }
    if (!empty($directorConditions)) {
        $relatedConditions[] = "(" . implode(' OR ', $directorConditions) . ")";
    }
}

if (!empty($movie['DienVien'])) {
    $actors = explode(',', $movie['DienVien']);
    $actorConditions = [];
    foreach ($actors as $actor) {
        $actor = trim($actor);
        if (!empty($actor)) {
            $actorConditions[] = "DienVien LIKE '%" . mysqli_real_escape_string($conn, $actor) . "%'";
        }
    }
    if (!empty($actorConditions)) {
        $relatedConditions[] = "(" . implode(' OR ', $actorConditions) . ")";
    }
}

if (!empty($movie['TheLoai'])) {
    $genres = explode(',', $movie['TheLoai']);
    $genreConditions = [];
    foreach ($genres as $genre) {
        $genre = trim($genre);
        if (!empty($genre)) {
            $genreConditions[] = "TheLoai LIKE '%" . mysqli_real_escape_string($conn, $genre) . "%'";
        }
    }
    if (!empty($genreConditions)) {
        $relatedConditions[] = "(" . implode(' OR ', $genreConditions) . ")";
    }
}

if (!empty($relatedConditions)) {
    $whereClause = "(" . implode(' OR ', $relatedConditions) . ") AND MaPhim != '$movieId'";
    
    $sqlRelated = "SELECT * FROM Phim 
                   WHERE $whereClause
                   ORDER BY RAND()
                   LIMIT 6";
    
    $relatedResult = mysqli_query($conn, $sqlRelated);
    
    if ($relatedResult) {
        while ($row = mysqli_fetch_assoc($relatedResult)) {
            $relatedMovies[] = $row;
        }
    }
}

$relatedMovies = array_slice($relatedMovies, 0, 4);

$response = [
    'movie' => $movie,
    'showtimes' => $showtimes,
    'relatedMovies' => $relatedMovies,
    'debug' => $debugInfo
];

echo json_encode($response, JSON_UNESCAPED_UNICODE);

mysqli_close($conn);
?>