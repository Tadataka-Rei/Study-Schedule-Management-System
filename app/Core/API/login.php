<?php
header('Content-Type: application/json');

header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Function to send a JSON response and exit
function sendResponse($status_code, $data) {
    http_response_code($status_code);
    echo json_encode($data);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendResponse(200, null);
}


if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(405, ['status' => 'error', 'message' => 'Method Not Allowed']);
}

require_once '../db.php'; 

if (!isset($conn) || $conn->connect_error) {
    sendResponse(500, ['status' => 'error', 'message' => 'Database connection failed during include.']);
}

$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

// Basic  validation
if (!isset($data['username']) || !isset($data['password'])) {
    $conn->close();
    sendResponse(400, ['status' => 'error', 'message' => 'Missing username or password.']);
}

$username = $data['username'];
$password = $data['password'];


$sql = "SELECT user_id, password_hash, role FROM Users WHERE username = ?";

// Initialise and prepare the statement
$stmt = $conn->prepare($sql);

if (!$stmt) {
    $conn->close();
    sendResponse(500, ['status' => 'error', 'message' => 'Database error during statement preparation.']);
}

// Bind the username parameter (s = string)
$stmt->bind_param("s", $username);

$stmt->execute();

// Get the result
$result = $stmt->get_result();
$user = $result->fetch_assoc();

$stmt->close();
$conn->close();

// Check if a user was found AND if the stored hash exists
if ($user && $user['password_hash']) {
    
    // Use password_verify() to check the entered password against the stored hash
    if (password_verify($password, $user['password_hash'])) {
        
        // --- LOGIN SUCCESSFUL ---
        
        sendResponse(200, [
            'status' => 'success',
            'message' => 'Login successful.',
            'user_id' => $user['user_id'],
            'role' => $user['role'],
        ]);

    } else {// wrong psassword
        sendResponse(401, ['status' => 'error', 'message' => 'Invalid username or password.']);
    }
} else {
    // No user found with that username
    sendResponse(401, ['status' => 'error', 'message' => 'Invalid username or password.']);
}

?>