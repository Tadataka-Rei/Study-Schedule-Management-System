<?php
// --- 1. CONFIGURATION AND HEADERS ---

// Set the response type to JSON
header('Content-Type: application/json');
// WARNING: The following header is for development/testing only. 
// For production, restrict this to your specific frontend domain(s).
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Function to send a JSON response and exit
function sendResponse($status_code, $data) {
    http_response_code($status_code);
    echo json_encode($data);
    exit();
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendResponse(200, null);
}

// Ensure the request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(405, ['status' => 'error', 'message' => 'Method Not Allowed']);
}

// --- 2. DATABASE CONNECTION ---

// Include the existing database connection script.
require_once '../db.php'; 

if (!isset($conn) || $conn->connect_error) {
    sendResponse(500, ['status' => 'error', 'message' => 'Database connection failed.']);
}

// --- 3. INPUT PROCESSING AND VALIDATION ---

// Read the raw JSON input from the request body
$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

// Get and sanitize inputs
$username = trim($data['username'] ?? '');
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';
$role = $data['role'] ?? 'Individual'; // Default role if not provided (check if allowed)
$profile_pic_path = $data['profile_pic_path'] ?? null; // Optional

// Server-side validation
if (empty($username) || empty($email) || empty($password)) {
    $conn->close();
    sendResponse(400, ['status' => 'error', 'message' => 'Vui lòng điền đầy đủ Tên đăng nhập, Email, và Mật khẩu.']);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $conn->close();
    sendResponse(400, ['status' => 'error', 'message' => 'Địa chỉ email không hợp lệ.']);
}

$allowed_roles = ['Teacher', 'Student', 'Individual'];
if (!in_array($role, $allowed_roles)) {
    $role = 'Individual'; // Force default if invalid role is passed
}

// --- 4. CHECK FOR DUPLICATES (Username and Email) ---

$check_sql = "SELECT user_id FROM Users WHERE username = ? OR email = ?";
$stmt = $conn->prepare($check_sql);
$stmt->bind_param("ss", $username, $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    // A user with this username or email already exists
    $stmt->close();
    $conn->close();
    sendResponse(409, ['status' => 'error', 'message' => 'Tên đăng nhập hoặc Email đã tồn tại.']);
}
$stmt->close();

// --- 5. SECURE PASSWORD HASHING ---

// Your existing password hashing method (essential for security!)
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);


// --- 6. INSERT NEW USER ---

$insertSQL = "
    INSERT INTO Users (username, email, password_hash, role, profile_pic_path)
    VALUES (?, ?, ?, ?, ?)
";

// Prepare the INSERT statement
$stmt = $conn->prepare($insertSQL);

if (!$stmt) {
    $conn->close();
    sendResponse(500, ['status' => 'error', 'message' => 'Database error during insertion preparation.']);
}

// Bind parameters: (s=string, s=string, s=string, s=string, s=string)
$stmt->bind_param("sssss", $username, $email, $hashedPassword, $role, $profile_pic_path);

if ($stmt->execute()) {
    // Insertion successful
    $new_user_id = $conn->insert_id; // Get the ID of the newly created user
    
    $stmt->close();
    $conn->close();

    sendResponse(201, [ // HTTP 201 Created
        'status' => 'success',
        'message' => 'Đăng ký thành công!',
        'user_id' => $new_user_id,
        'username' => $username,
        'role' => $role
    ]);

} else {
    // Insertion failed for other reasons
    $error_message = $conn->error;
    $stmt->close();
    $conn->close();
    sendResponse(500, ['status' => 'error', 'message' => "Lỗi đăng ký người dùng: {$error_message}"]);
}
?>