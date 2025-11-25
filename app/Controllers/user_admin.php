<?php
$host = 'localhost'; 
$db_name = 'app_db';
$user = 'ratashi';
$password = '123456789';
$charset = 'utf8mb4';

$uploadDir = '../db/uploads/user_pfp/'; 

$dsn = "mysql:host=$host;dbname=$db_name;charset=$charset";

$message = '';
$messageType = '';
$pdo = null; 

try {

    $pdo = new PDO($dsn, $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); 
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);// get data fussion array mode



    // ---------------------/----------------------------------------------------
    // --- Form + upload pfp---
    // -------------------------------------------------------------------------
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_user'])) {
        
        // clean data
        $ten_dang_nhap = htmlspecialchars(trim(filter_input(INPUT_POST, 'username', FILTER_DEFAULT)), ENT_QUOTES, 'UTF-8');
        $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
        $mat_khau_tho = $_POST['password']; 
        $vai_tro = $_POST['role'];
        $profilePicturePath = null; 

 // --- process pfp ---
if (isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['profile_picture']['tmp_name'];
    $fileName = basename($_FILES['profile_picture']['name']);
    $fileNameCmps = explode(".", $fileName);
    $fileExtension = strtolower(end($fileNameCmps));

    $allowedfileExtensions = array('jpg', 'gif', 'png', 'jpeg');

    //check MINE
    if (in_array($fileExtension, $allowedfileExtensions)) {
        
        // check mine type, not with extension... well incase you fucker try to put in virus
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $fileTmpPath);

        $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!in_array($mimeType, $allowedMimeTypes)) {
            $message = 'Lỗi: Tệp tải lên không phải là ảnh hợp lệ.';
            $messageType = 'error';
        } else {
            // Limit size
            if ($_FILES['profile_picture']['size'] > 2 * 1024 * 1024) {
                $message = 'Lỗi: Kích thước ảnh vượt quá 2MB.';
                $messageType = 'error';
            } else {
                //make sure folder exist 
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                $newFileName = md5(time() . $fileName) . '.' . $fileExtension;
                $destPath = $uploadDir . $newFileName;

                if (move_uploaded_file($fileTmpPath, $destPath)) {
                    $profilePicturePath = $destPath; // save url
                } else {
                    $message = 'Lỗi lưu ảnh. Kiểm tra quyền ghi của thư mục uploads/user_pfp/.';
                    $messageType = 'error';
                }
            }
        }
    } else {
        $message = 'Lỗi: Loại tệp ảnh không hợp lệ. Chỉ chấp nhận JPG, GIF, PNG, JPEG.';
        $messageType = 'error';
    }
}



        // check no null field
        if (empty($ten_dang_nhap) || empty($email) || empty($mat_khau_tho) || empty($vai_tro)) {
            $message = 'Tên đăng nhập, Email, Mật khẩu và Vai trò là các trường bắt buộc.';
            $messageType = 'error';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $message = 'Vui lòng nhập địa chỉ email hợp lệ.';
            $messageType = 'error';
        } else {
            // Hash password
            $hashedPassword = password_hash($mat_khau_tho, PASSWORD_DEFAULT);

            $insertSQL = "
                INSERT INTO Users (username, email, password_hash, role, profile_pic_path)
                VALUES (:username, :email, :password_hash, :role, :profile_pic_path)
            ";
            $stmt = $pdo->prepare($insertSQL);

            try {
                $stmt->execute([
                    ':username' => $ten_dang_nhap,
                    ':email' => $email,
                    ':password_hash' => $hashedPassword,
                    ':role' => $vai_tro,
                    ':profile_pic_path' => $profilePicturePath // save url
                ]);
                $message = 'Thêm người dùng thành công! ID mới là: ' . $pdo->lastInsertId();
                $messageType = 'success';
            
            } catch (PDOException $e) {
                if ($e->getCode() == '23000') { 
                    $message = 'Lỗi: Đã tồn tại người dùng với Tên đăng nhập hoặc Email này.';
                } else {
                    $message = 'Lỗi cơ sở dữ liệu: ' . $e->getMessage();
                }
                $messageType = 'error';
            }
        }
    }

    // -------------------------------------------------------------------------
    // --- Lấy tất cả người dùng để hiển thị ---
    // -------------------------------------------------------------------------
    $users = []; 
    $selectUsersSQL = "
        SELECT 
            user_id,
            username,
            email,
            role,
            profile_pic_path,
            created_at
        FROM
            Users
        ORDER BY
            created_at DESC;
    ";
    $stmt = $pdo->query($selectUsersSQL);
    $users = $stmt->fetchAll();

} catch (PDOException $e) {
    // Xử lý lỗi kết nối CSDL
    $message = 'Lỗi kết nối cơ sở dữ liệu: ' . $e->getMessage();
    $messageType = 'error';
} 

// ------------------------------------------------------------------------
// ---(HTML/CSS GUI)
// -------------------------------------------------------------------------
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bảng Điều Khiển Quản Trị Người Dùng</title>
    <style>
        /* Light Mode Base Styles */
        body {
            background-color: #f0f2f5;
            color: #333;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            transition: background-color 0.3s, color 0.3s;
        }
        .container {
            max-width: 1000px;
            margin: 2rem auto;
            padding: 2rem;
            background-color: #ffffff;
            border-radius: 16px;
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
            transition: background-color 0.3s, box-shadow 0.3s;
        }
        h1, h2 {
            color: #1e3a8a;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 10px;
            margin-bottom: 25px;
            transition: color 0.3s, border-color 0.3s;
        }
        form div {
            margin-bottom: 1.25rem;
        }
        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 700;
            color: #1f2937;
            transition: color 0.3s;
        }
        label span {
            color: #dc2626; 
        }
        .form-input, .form-select {
            width: 100%;
            padding: 12px;
            border: 1px solid #d1d5db; 
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s, box-shadow 0.3s, background-color 0.3s, color 0.3s;
            box-sizing: border-box;
            background-color: #f9fafb;
        }
        .form-input:focus, .form-select:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
        }
        .btn-primary {
            background-color: #10b981; /* Green */
            color: white;
            padding: 14px 24px;
            border-radius: 8px;
            font-weight: 600;
            transition: background-color 0.2s ease-in-out, transform 0.1s;
            cursor: pointer;
            border: none;
            width: 100%;
            margin-top: 10px;
        }
        .btn-primary:hover {
            background-color: #059669;
            transform: translateY(-1px);
        }
        .message {
            padding: 1rem;
            margin-bottom: 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            transition: background-color 0.3s, color 0.3s, border-color 0.3s;
        }
        .message.success {
            background-color: #d1fae5; 
            color: #065f46;
            border: 1px solid #34d399;
        }
        .message.error {
            background-color: #fee2e2; 
            color: #991b1b;
            border: 1px solid #f87171; 
        }
        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            border-radius: 12px;
            overflow: hidden; 
            margin-top: 2rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            transition: box-shadow 0.3s;
        }
        th, td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid #e5e7eb; 
            transition: border-bottom 0.3s;
        }
        th {
            background-color: #eef2ff; /* Light Blue Header */
            font-weight: 700;
            color: #1e3a8a;
            text-transform: uppercase;
            font-size: 0.85rem;
            letter-spacing: 0.05em;
            transition: background-color 0.3s, color 0.3s;
        }
        tr:nth-child(even) {
            background-color: #f9fafb;
            transition: background-color 0.3s;
        }
        tr:hover {
            background-color: #eff6ff;
        }
        .profile-pic-thumbnail {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: #4b5563;
            font-size: 0.75rem;
            overflow: hidden;
            transition: border-color 0.3s, background-color 0.3s;
        }

        /* --- DARK MODE STYLES --- */
        
        .mode-toggle-container {
            text-align: right;
            margin-bottom: 15px;
        }
        .mode-toggle-btn {
            padding: 8px 15px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: background-color 0.2s, color 0.2s;
            background-color: #d1d5db; /* Light gray */
            color: #1f2937; /* Dark text */
        }
        .mode-toggle-btn:hover {
            background-color: #9ca3af;
        }

        /* Applying dark mode class to body */
        body.dark-mode {
            background-color: #121212; 
            color: #e0e0e0; 
        }
        body.dark-mode .container {
            background-color: #1e1e1e; 
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
        }
        body.dark-mode h1, body.dark-mode h2 {
            color: #bbdefb; /* Light blue headers */
            border-bottom: 2px solid #64b5f6;
        }
        body.dark-mode label {
            color: #bdbdbd;
        }
        body.dark-mode .form-input, body.dark-mode .form-select {
            background-color: #2c2c2c;
            border: 1px solid #424242;
            color: #e0e0e0;
        }
        body.dark-mode .form-input:focus, body.dark-mode .form-select:focus {
            border-color: #64b5f6;
            box-shadow: 0 0 0 3px rgba(100, 181, 246, 0.25);
        }
        body.dark-mode .message.success {
            background-color: #1b5e20; /* Dark green */
            color: #c8e6c9;
            border: 1px solid #4caf50;
        }
        body.dark-mode .message.error {
            background-color: #b71c1c; /* Dark red */
            color: #ffcdd2;
            border: 1px solid #ef5350;
        }
        body.dark-mode table {
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
        }
        body.dark-mode th {
            background-color: #2b3952; /* Dark table header */
            color: #bbdefb;
            border-bottom: 1px solid #424242;
        }
        body.dark-mode td {
            border-bottom: 1px solid #333333;
        }
        body.dark-mode tr:nth-child(even) {
            background-color: #242424;
        }
        body.dark-mode tr:hover {
            background-color: #333333; /* Darker hover */
        }
        body.dark-mode .mode-toggle-btn {
            background-color: #424242; 
            color: #e0e0e0;
        }
        body.dark-mode .mode-toggle-btn:hover {
            background-color: #616161;
        }
        body.dark-mode .profile-pic-thumbnail {
            border: 2px solid #424242;
            color: #a0a0a0;
        }
        /* Style for the "No Pic" placeholder in dark mode */
        body.dark-mode .profile-pic-thumbnail[style*="#e0f2fe"] {
            background-color: #334e68 !important; 
            color: #bbdefb !important; 
        }
    </style>
</head>
<body>
    <div class="container">
        
        <!-- DARK MODE TOGGLE BUTTON -->
        <div class="mode-toggle-container">
            <button id="darkModeToggle" class="mode-toggle-btn">
                Chuyển sang Chế độ Tối
            </button>
        </div>
        <!-- END DARK MODE TOGGLE BUTTON -->

        <h1>Bảng Điều Khiển Quản Lý Người Dùng</h1>

        <!-- Hiển thị Thông báo -->
        <?php if ($message): ?>
            <div class="message <?php echo $messageType; ?>">
                <?php echo htmlspecialchars($message); ?>
            </div>
        <?php endif; ?>

        <!-- Khu vực Thêm Người Dùng Mới -->
        <div>
            <h2>Thêm Người Dùng Mới</h2>
            <!-- Quan trọng: enctype="multipart/form-data" là cần thiết cho upload file -->
            <form action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>" method="POST" enctype="multipart/form-data">
                
                <div>
                    <label for="username">Tên Đăng Nhập <span>*</span></label>
                    <input type="text" id="username" name="username" required class="form-input" placeholder="Ví dụ: rick_ashley">
                </div>
                
                <div>
                    <label for="email">Email <span>*</span></label>
                    <input type="email" id="email" name="email" required class="form-input" placeholder="Ví dụ: user@example.com">
                </div>
                
                <div>
                    <label for="password">Mật Khẩu <span>*</span></label>
                    <input type="password" id="password" name="password" required class="form-input" placeholder="Nhập mật khẩu (Sẽ được băm)">
                </div>
                
                <div>
                    <label for="role">Vai Trò <span>*</span></label>
                    <select id="role" name="role" required class="form-input form-select">
                        <option value="" disabled selected>-- Chọn Vai Trò --</option>
                        <option value="Teacher">Giáo Viên</option>
                        <option value="Student">Học Sinh</option>
                        <option value="Individual">Cá Nhân</option>
                    </select>
                </div>
                
                <div>
                    <!-- Đã đổi lại thành input type=file để cho phép kéo thả/chọn tệp -->
                    <label for="profile_picture">Ảnh Đại Diện (Kéo thả hoặc Chọn tệp)</label>
                    <input type="file" id="profile_picture" name="profile_picture" accept="image/*" class="form-input">
                </div>
                
                <button type="submit" name="add_user" class="btn-primary">Thêm Người Dùng Mới</button>
            </form>
        </div>

        <!-- Khu vực Danh Sách Người Dùng Hiện Có -->
        <div>
            <h2>Người Dùng Hiện Có</h2>
            <?php if (!empty($users)): ?>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Ảnh</th> 
                            <th>Tên Đăng Nhập</th>
                            <th>Email</th>
                            <th>Vai Trò</th>
                            <th>Ngày Tạo</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($users as $user): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($user['user_id']); ?></td>
                                <td>
                                    <?php 
                                        $imagePath = $user['profile_pic_path'];
                                        $imageExists = !empty($imagePath); // Trong môi trường thực, bạn cần kiểm tra file_exists($imagePath)
                                    ?>
                                    <?php if ($imageExists): ?>
                                        <img src="<?php echo htmlspecialchars($imagePath); ?>" alt="Ảnh ĐD" class="profile-pic-thumbnail">
                                    <?php else: ?>
                                        <div class="profile-pic-thumbnail" style="background-color: #e0f2fe; border: none;">No Pic</div>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo htmlspecialchars($user['username']); ?></td>
                                <td><?php echo htmlspecialchars($user['email']); ?></td>
                                <td><?php echo htmlspecialchars($user['role']); ?></td>
                                <td><?php echo htmlspecialchars(date('Y-m-d H:i', strtotime($user['created_at']))); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php else: ?>
                <p>Không tìm thấy người dùng nào trong cơ sở dữ liệu. Hãy thêm mới bằng form phía trên!</p>
            <?php endif; ?>
        </div>
    </div>

    <!-- JavaScript for Dark Mode Toggle -->
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const toggleButton = document.getElementById('darkModeToggle');
            const body = document.body;
            const darkModeKey = 'darkModeEnabled';

            // 1. Load saved preference
            const savedMode = localStorage.getItem(darkModeKey);

            function setMode(isDark) {
                if (isDark) {
                    body.classList.add('dark-mode');
                    toggleButton.textContent = 'Chuyển sang Chế độ Sáng';
                    localStorage.setItem(darkModeKey, 'true');
                } else {
                    body.classList.remove('dark-mode');
                    toggleButton.textContent = 'Chuyển sang Chế độ Tối';
                    localStorage.setItem(darkModeKey, 'false');
                }
            }

            // Apply saved mode or check system preference
            if (savedMode === 'true') {
                setMode(true);
            } else if (savedMode === null && window.matchMedia('(prefers-color-scheme: dark)').matches) {

                setMode(true);
            } else {
                // Default is light mode
                setMode(false);
            }


            // FUCK ME
            toggleButton.addEventListener('click', () => {
                const isDark = body.classList.contains('dark-mode');
                setMode(!isDark);
            });
        });
    </script>
</body>
</html>