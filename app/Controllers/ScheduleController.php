<?php
// 1. Cấu hình CSDL
$host = 'localhost'; 
$db_name = 'app_db';
$user = 'ratashi';
$password = '123456789';
$charset = 'utf8mb4';

$uploadDir = '../db/uploads/course_thumbnails/'; // Thư mục mới cho ảnh thumbnail
$dsn = "mysql:host=$host;dbname=$db_name;charset=$charset";

$message = '';
$messageType = '';
$pdo = null;

try {
    $pdo = new PDO($dsn, $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);


    // --- Lấy danh sách Giáo viên (Users có role = 'Teacher') ---
    $teachers = [];
    $selectTeachersSQL = "
        SELECT 
            user_id,
            username
        FROM
            Users
        WHERE
            role = 'Teacher'
        ORDER BY
            username ASC;
    ";
    $stmt = $pdo->query($selectTeachersSQL);
    $teachers = $stmt->fetchAll();

    // -------------------------------------------------------------------------
    // --- Xử lý gửi form khóa học mới (Bao gồm Tải tệp Thumbnail) ---
    // -------------------------------------------------------------------------
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_course'])) {
        
        // Lấy và làm sạch dữ liệu đầu vào
        $teacherId = filter_input(INPUT_POST, 'teacher_id', FILTER_VALIDATE_INT);
        $courseName = htmlspecialchars(trim(filter_input(INPUT_POST, 'course_name', FILTER_DEFAULT)), ENT_QUOTES, 'UTF-8');
        $description = htmlspecialchars(trim(filter_input(INPUT_POST, 'description', FILTER_DEFAULT)), ENT_QUOTES, 'UTF-8');
        $content = htmlspecialchars(trim(filter_input(INPUT_POST, 'course_content', FILTER_DEFAULT)), ENT_QUOTES, 'UTF-8');
        $passkey = htmlspecialchars(trim(filter_input(INPUT_POST, 'passkey', FILTER_DEFAULT)), ENT_QUOTES, 'UTF-8');
        $isPrivate = isset($_POST['is_private']) ? 1 : 0;
        $startingDate = empty($_POST['starting_date']) ? null : $_POST['starting_date'];
        $endingDate = empty($_POST['ending_date']) ? null : $_POST['ending_date'];
        $thumbnailPath = null; 

        // --- Xử lý tải lên Ảnh Thumbnail ---
        if (isset($_FILES['thumbnail']) && $_FILES['thumbnail']['error'] === UPLOAD_ERR_OK) {
            $fileTmpPath = $_FILES['thumbnail']['tmp_name'];
            $fileName = basename($_FILES['thumbnail']['name']);
            $fileNameCmps = explode(".", $fileName);
            $fileExtension = strtolower(end($fileNameCmps));

            $allowedfileExtensions = array('jpg', 'gif', 'png', 'jpeg');
            $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
            $maxFileSize = 5 * 1024 * 1024; // 5MB

            if (!in_array($fileExtension, $allowedfileExtensions)) {
                $message = 'Lỗi: Loại tệp ảnh thumbnail không hợp lệ.';
                $messageType = 'error';
            } else {
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $mimeType = finfo_file($finfo, $fileTmpPath);
                // finfo_close もう要らない

                if (!in_array($mimeType, $allowedMimeTypes)) {
                    $message = 'Lỗi: Tệp tải lên không phải là ảnh hợp lệ.';
                    $messageType = 'error';
                } elseif ($_FILES['thumbnail']['size'] > $maxFileSize) {
                    $message = 'Lỗi: Kích thước ảnh vượt quá 5MB.';
                    $messageType = 'error';
                } else {
                    if (!is_dir($uploadDir)) {
                        mkdir($uploadDir, 0777, true);
                    }
                    $newFileName = md5(time() . $fileName) . '.' . $fileExtension;
                    $destPath = $uploadDir . $newFileName;

                    if (move_uploaded_file($fileTmpPath, $destPath)) {
                        $thumbnailPath = $destPath; 
                    } else {
                        $message = 'Lỗi lưu ảnh thumbnail. Kiểm tra quyền ghi của thư mục uploads/course_thumbnails/.';
                        $messageType = 'error';
                    }
                }
            }
        }
        // --- Kết thúc xử lý tải lên ---

        // 俺を殺せくれ！！
        if (empty($teacherId) || empty($courseName) || !is_numeric($teacherId)) {
            $message = 'Giáo viên, Tên khóa học là các trường bắt buộc và phải hợp lệ.';
            $messageType = 'error';
        } elseif ($messageType != 'error') { //眠い
            
            $insertSQL = "
                INSERT INTO Courses (teacher_id, course_name, description, course_content, passkey, is_private, thumbnail_url, starting_date, ending_date)
                VALUES (:teacher_id, :course_name, :description, :course_content, :passkey, :is_private, :thumbnail_url, :starting_date, :ending_date)
            ";
            $stmt = $pdo->prepare($insertSQL);
            //AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
            try {
                $stmt->execute([
                    ':teacher_id' => $teacherId,
                    ':course_name' => $courseName,
                    ':description' => $description,
                    ':course_content' => $content,
                    ':passkey' => $passkey,
                    ':is_private' => $isPrivate,
                    ':thumbnail_url' => $thumbnailPath, 
                    ':starting_date' => $startingDate,
                    ':ending_date' => $endingDate
                ]);
                $message = 'Thêm khóa học thành công! ID mới là: ' . $pdo->lastInsertId();
                $messageType = 'success';
            
            } catch (PDOException $e) {
                if ($e->getCode() == '23000') { 
                    $message = 'Lỗi: ID Giáo viên không tồn tại.';
                } else {
                    $message = 'Lỗi cơ sở dữ liệu: ' . $e->getMessage();
                }
                $messageType = 'error';
            }
        }
    }

    // -------------------------------------------------------------------------
    // --- Lấy tất cả khóa học để hiển thị ---
    // -------------------------------------------------------------------------
    $courses = []; 
    // DO NOT QUESTION THIS SHIT, I HAVE NO IDEA HOW IT WORKS EITHER
    $selectCoursesSQL = "
        SELECT 
            c.course_id,
            c.course_name,
            c.description,
            c.passkey,
            c.is_private,
            c.thumbnail_url,
            c.created_at,
            c.starting_date,
            c.ending_date,
            u.username AS teacher_username
        FROM
            Courses c
        JOIN
            Users u ON c.teacher_id = u.user_id
        ORDER BY
            c.created_at DESC;
    ";
    $stmt = $pdo->query($selectCoursesSQL);
    $courses = $stmt->fetchAll();

} catch (PDOException $e) {
    $message = 'Lỗi kết nối cơ sở dữ liệu hoặc khởi tạo: ' . $e->getMessage();
    $messageType = 'error';
    $teachers = []; 
    $courses = []; 
} 
// FUCK YOU! CHAT GPT GO BRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR
// ------------------------------------------------------------------------
// ---(HTML/CSS GUI)
// -------------------------------------------------------------------------
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bảng Điều Khiển Quản Trị Khóa Học</title>
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
            max-width: 1200px;
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
        .form-input, .form-select, .form-textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #d1d5db; 
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s, box-shadow 0.3s, background-color 0.3s, color 0.3s;
            box-sizing: border-box;
            background-color: #f9fafb;
        }
        .form-input:focus, .form-select:focus, .form-textarea:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
        }
        .form-textarea {
            resize: vertical;
            min-height: 100px;
        }
        .form-checkbox-group {
            display: flex;
            align-items: center;
        }
        .form-checkbox-group input {
            width: auto;
            margin-right: 10px;
            transform: scale(1.2);
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
            background-color: #eff6ff; /* Highlight row on hover */
        }
        .thumbnail-img {
            width: 60px;
            height: 40px;
            object-fit: cover;
            border-radius: 4px;
            border: 1px solid #d1d5db;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .public {
            background-color: #ecfdf5;
            color: #059669;
        }
        .private {
            background-color: #fef2f2;
            color: #ef4444;
        }
        .no-pic-placeholder {
            width: 60px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #e0f2fe;
            color: #0369a1;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: 500;
        }

        /* --- DARK MODE STYLES --- (Giữ lại từ phiên bản gốc) */
        
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
        body.dark-mode .form-input, body.dark-mode .form-select, body.dark-mode .form-textarea {
            background-color: #2c2c2c;
            border: 1px solid #424242;
            color: #e0e0e0;
        }
        body.dark-mode .form-input:focus, body.dark-mode .form-select:focus, body.dark-mode .form-textarea:focus {
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
        body.dark-mode .status-badge.public {
            background-color: #004d40;
            color: #a5d6a7;
        }
        body.dark-mode .status-badge.private {
            background-color: #4e0000;
            color: #ef9a9a;
        }
        body.dark-mode .no-pic-placeholder {
             background-color: #334e68;
            color: #bbdefb;
            border: 1px solid #424242;
        }
    </style>
</head>
<body>
    <div class="container">
        
        <div class="mode-toggle-container">
            <button id="darkModeToggle" class="mode-toggle-btn">
                Chuyển sang Chế độ Tối
            </button>
        </div>
        <h1>Quản Lý Khóa Học 📚</h1>

        <?php if ($message): ?>
            <div class="message <?php echo $messageType; ?>">
                <?php echo htmlspecialchars($message); ?>
            </div>
        <?php endif; ?>

        <hr>

        <div>
            <h2>Thêm Khóa Học Mới</h2>
            <form action="<?php echo htmlspecialchars($_SERVER["PHP_SELF"]); ?>" method="POST" enctype="multipart/form-data">
                
                <div>
                    <label for="course_name">Tên Khóa Học <span>*</span></label>
                    <input type="text" id="course_name" name="course_name" required class="form-input" placeholder="Ví dụ: Lập trình PHP cơ bản">
                </div>

                <div>
                    <label for="teacher_id">Giáo Viên Phụ Trách <span>*</span></label>
                    <select id="teacher_id" name="teacher_id" required class="form-input form-select">
                        <option value="" disabled selected>-- Chọn Giáo Viên --</option>
                        <?php foreach ($teachers as $teacher): ?>
                            <option value="<?php echo htmlspecialchars($teacher['user_id']); ?>">
                                <?php echo htmlspecialchars($teacher['username']); ?> (ID: <?php echo htmlspecialchars($teacher['user_id']); ?>)
                            </option>
                        <?php endforeach; ?>
                    </select>
                    <?php if (empty($teachers)): ?>
                        <p style="color: red;">⚠️ Không tìm thấy người dùng có vai trò 'Teacher'. Vui lòng thêm giáo viên trước.</p>
                    <?php endif; ?>
                </div>
                
                <div>
                    <label for="description">Mô Tả Ngắn</label>
                    <textarea id="description" name="description" class="form-input form-textarea" placeholder="Mô tả tóm tắt về khóa học..."></textarea>
                </div>
                
                <div>
                    <label for="course_content">Nội Dung Chi Tiết</label>
                    <textarea id="course_content" name="course_content" class="form-input form-textarea" placeholder="Liệt kê các chủ đề/bài học..."></textarea>
                </div>

                <div style="display: flex; gap: 20px;">
                    <div style="flex: 1;">
                        <label for="starting_date">Ngày Bắt Đầu</label>
                        <input type="date" id="starting_date" name="starting_date" class="form-input">
                    </div>
                    <div style="flex: 1;">
                        <label for="ending_date">Ngày Kết Thúc (Tùy chọn)</label>
                        <input type="date" id="ending_date" name="ending_date" class="form-input">
                    </div>
                </div>

                <div style="display: flex; gap: 20px;">
                    <div style="flex: 1;">
                        <label for="passkey">Mã Khóa Học (Passkey)</label>
                        <input type="text" id="passkey" name="passkey" class="form-input" placeholder="Mã cần thiết để đăng ký khóa học (Tùy chọn)">
                    </div>
                    <div class="form-checkbox-group" style="flex: 1; align-self: flex-end; margin-bottom: 0;">
                        <input type="checkbox" id="is_private" name="is_private" value="1" style="height: 20px;">
                        <label for="is_private" style="margin-bottom: 0; display: inline; font-weight: normal;">Khóa Học Riêng Tư (Chỉ vào được bằng Passkey)</label>
                    </div>
                </div>
                
                <div>
                    <label for="thumbnail">Ảnh Thumbnail Khóa Học (Kéo thả hoặc Chọn tệp)</label>
                    <input type="file" id="thumbnail" name="thumbnail" accept="image/*" class="form-input">
                </div>
                
                <button type="submit" name="add_course" class="btn-primary" <?php echo empty($teachers) ? 'disabled' : ''; ?>>
                    Thêm Khóa Học Mới
                </button>
            </form>
        </div>

        <hr>

        <div>
            <h2>Danh Sách Khóa Học</h2>
            <?php if (!empty($courses)): ?>
                <div style="overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Thumbnail</th> 
                                <th>Tên Khóa Học</th>
                                <th>Giáo Viên</th>
                                <th>Passkey</th>
                                <th>Trạng Thái</th>
                                <th>Bắt Đầu</th>
                                <th>Kết Thúc</th>
                                <th>Ngày Tạo</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($courses as $course): ?>
                                <tr>
                                    <td><?php echo htmlspecialchars($course['course_id']); ?></td>
                                    <td>
                                        <?php 
                                            $imagePath = $course['thumbnail_url'];
                                            // Kiểm tra file_exists() cần được thực hiện trong môi trường chạy thực tế.
                                            // Giả định nếu có đường dẫn thì ảnh tồn tại để hiển thị demo.
                                            $imageExists = !empty($imagePath); 
                                        ?>
                                        <?php if ($imageExists): ?>
                                            <img src="<?php echo htmlspecialchars($imagePath); ?>" alt="Thumbnail" class="thumbnail-img">
                                        <?php else: ?>
                                            <div class="no-pic-placeholder">No Image</div>
                                        <?php endif; ?>
                                    </td>
                                    <td><?php echo htmlspecialchars($course['course_name']); ?></td>
                                    <td><?php echo htmlspecialchars($course['teacher_username']); ?></td>
                                    <td><?php echo $course['passkey'] ? htmlspecialchars($course['passkey']) : 'N/A'; ?></td>
                                    <td>
                                        <?php if ($course['is_private']): ?>
                                            <span class="status-badge private">Riêng Tư</span>
                                        <?php else: ?>
                                            <span class="status-badge public">Công Khai</span>
                                        <?php endif; ?>
                                    </td>
                                    <td><?php echo $course['starting_date'] ? htmlspecialchars(date('Y-m-d', strtotime($course['starting_date']))) : 'Chưa xác định'; ?></td>
                                    <td><?php echo $course['ending_date'] ? htmlspecialchars(date('Y-m-d', strtotime($course['ending_date']))) : 'Vô thời hạn'; ?></td>
                                    <td><?php echo htmlspecialchars(date('Y-m-d H:i', strtotime($course['created_at']))); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php else: ?>
                <p>Không tìm thấy khóa học nào trong cơ sở dữ liệu. Hãy thêm mới bằng form phía trên!</p>
            <?php endif; ?>
        </div>
    </div>

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
                // If no preference saved, use system preference (start in dark mode if system is dark)
                setMode(true);
            } else {
                // Default is light mode
                setMode(false);
            }


            // 2. Add event listener
            toggleButton.addEventListener('click', () => {
                const isDark = body.classList.contains('dark-mode');
                setMode(!isDark);
            });
        });
    </script>
</body>
</html>