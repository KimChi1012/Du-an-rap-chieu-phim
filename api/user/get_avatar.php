<?php
ini_set('session.cookie_path', '/');
ini_set('session.cookie_domain', '');
ini_set('session.cookie_secure', false);
ini_set('session.cookie_httponly', true);
ini_set('session.use_strict_mode', false);

session_start();

error_log("Avatar request - Session ID: " . session_id());
error_log("Avatar request - User ID: " . ($_SESSION['user_id'] ?? 'not set'));
error_log("Avatar request - All session data: " . print_r($_SESSION, true));

if (isset($_GET['test_user'])) {
    $_SESSION['user_id'] = $_GET['test_user'];
    error_log("Test mode - Set user_id to: " . $_GET['test_user']);
}

if (isset($_GET['id']) && !empty($_GET['id'])) {
    $user_id = $_GET['id'];
    error_log("Using user_id from URL parameter: " . $user_id);
} else {
    if (!isset($_SESSION['user_id'])) {
        error_log("No user_id in session and no id parameter, serving default avatar");
        header("X-Avatar-Error: no-session");
        header("Content-Type: image/jpeg");
        $defaultPath = __DIR__ . "/../../public/images/default-avatar.jpeg";
        if (file_exists($defaultPath)) {
            readfile($defaultPath);
        } else {
            error_log("Default avatar file not found: " . $defaultPath);
            header("Content-Type: image/png");
            $img = imagecreate(100, 100);
            $bg = imagecolorallocate($img, 200, 200, 200);
            imagepng($img);
            imagedestroy($img);
        }
        exit;
    }
    $user_id = $_SESSION['user_id'];
}

include __DIR__ . "/../db.php";
error_log("Getting avatar for user: " . $user_id);

$stmt = $conn->prepare("SELECT Avatar FROM NguoiDung WHERE MaND = ?");
$stmt->bind_param("s", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    error_log("User not found in database: " . $user_id);
    header("X-Avatar-Error: user-not-found");
    $stmt->close();
    $conn->close();
    header("Content-Type: image/jpeg");
    $defaultPath = __DIR__ . "/../../public/images/default-avatar.jpeg";
    if (file_exists($defaultPath)) {
        readfile($defaultPath);
    } else {
        header("Content-Type: image/png");
        $img = imagecreate(100, 100);
        $bg = imagecolorallocate($img, 200, 200, 200);
        imagepng($img);
        imagedestroy($img);
    }
    exit;
}

$row = $result->fetch_assoc();
$avatarData = $row['Avatar'];
$stmt->close();
$conn->close();

error_log("Avatar data type: " . gettype($avatarData));
error_log("Avatar data is null: " . ($avatarData === null ? 'true' : 'false'));
error_log("Avatar data length: " . (is_string($avatarData) ? strlen($avatarData) : 'not string'));

if ($avatarData !== null && $avatarData !== '' && strlen($avatarData) > 0) {
    error_log("Found avatar data for user, size: " . strlen($avatarData));

    if (strpos($avatarData, 'data:image/') === 0) {
        error_log("Avatar is stored as data URL");
        // Extract the actual image data from data URL
        $parts = explode(',', $avatarData, 2);
        if (count($parts) === 2) {
            $header = $parts[0]; // data:image/png;base64
            $imageData = base64_decode($parts[1]);

            preg_match('/data:([^;]+)/', $header, $matches);
            $mime = isset($matches[1]) ? $matches[1] : 'image/png';
            
            error_log("Extracted MIME type from data URL: " . $mime);
            error_log("Decoded image size: " . strlen($imageData) . " bytes");

            header("Cache-Control: no-cache, no-store, must-revalidate");
            header("Pragma: no-cache");
            header("Expires: 0");
            header("Content-Type: $mime");
            header("Content-Length: " . strlen($imageData));
            header("X-Avatar-Status: served");
            header("X-Avatar-MIME: $mime");
            header("X-Avatar-Length: " . strlen($imageData));
            if (ob_get_length()) ob_end_clean();
            echo $imageData;
            exit;
        } else {
            error_log("Invalid data URL format");
            header("Content-Type: image/jpeg");
            $defaultPath = __DIR__ . "/../../public/images/default-avatar.jpeg";
            if (file_exists($defaultPath)) {
                readfile($defaultPath);
            }
        }
    } else {
        error_log("Avatar is stored as binary data");
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->buffer($avatarData);

        if (!$mime) $mime = "image/png";
        
        error_log("Avatar MIME type detected: " . $mime);

        header("Cache-Control: no-cache, no-store, must-revalidate");
        header("Pragma: no-cache");
        header("Expires: 0");
        header("Content-Type: $mime");
        header("Content-Length: " . strlen($avatarData));
        header("X-Avatar-Status: served");
        header("X-Avatar-MIME: $mime");
        header("X-Avatar-Length: " . strlen($avatarData));
        if (ob_get_length()) ob_end_clean();
        echo $avatarData;
        exit;
    }
} else {
    error_log("No avatar data found for user (null, empty, or zero length), serving default");
    header("X-Avatar-Error: avatar-empty");
    header("Content-Type: image/jpeg");
    $defaultPath = __DIR__ . "/../../public/images/default-avatar.jpeg";
    if (file_exists($defaultPath)) {
        error_log("Serving default avatar from: " . $defaultPath);
        header("X-Avatar-Fallback: default-served");
        readfile($defaultPath);
    } else {
        error_log("Default avatar file not found: " . $defaultPath);
        header("Content-Type: image/png");
        $img = imagecreate(100, 100);
        $bg = imagecolorallocate($img, 200, 200, 200);
        imagepng($img);
        imagedestroy($img);
    }
}

