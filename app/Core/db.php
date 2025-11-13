<?php
$host = 'localhost'; 
$db_name = 'app_db'; 
$user = 'ratashi'; 
$password = '123456789'; 
$charset = 'utf8mb4'; 

if (!function_exists('mysqli_init') && !extension_loaded('mysqli')) {
    echo 'We don\'t have mysqli!!!';
}
// Create connection
$conn = new mysqli($host, $user, $password, $db_name);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
// Optional: Set character set to utf8mb4
$conn->set_charset("utf8mb4");

// Note: You would typically include this file in your main processing script.
?>