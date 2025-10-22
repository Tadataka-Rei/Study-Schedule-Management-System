# Hệ thống Quản lý Lịch Học Tập (Study Schedule Management System)

## 🌟 Tổng quan
Hệ thống này được thiết kế để hỗ trợ học sinh, sinh viên, giáo viên và các tổ chức giáo dục **tổ chức, theo dõi và quản lý hiệu quả tất cả các hoạt động học tập**. Nó đóng vai trò là công cụ lập kế hoạch kỹ thuật số tập trung cho các lớp học, bài tập, kỳ thi và các buổi tự học, giúp người dùng luôn nắm bắt được lịch trình và các deadline quan trọng.

---

## ✨ Tính năng Nổi bật
* **Tạo Thời khóa biểu Linh hoạt (Dynamic Timetable Creation):** Dễ dàng tạo và xem lịch học theo tuần hoặc theo học kỳ.
* **Theo dõi Bài tập & Nhiệm vụ (Assignment & Task Tracker):** Ghi lại bài tập về nhà, dự án và mục tiêu học tập với các deadline có thể tùy chỉnh.
* **Nhắc nhở Tự động (Automated Reminders):** Nhận thông báo về các buổi học sắp tới và các deadline nộp bài quan trọng.
* **Theo dõi Kết quả Học tập (Grade/Progress Monitoring):** Ghi nhận và theo dõi điểm số, hiệu suất học tập ở các môn học khác nhau.
* **Đồng bộ Đa nền tảng (Multi-Platform Synchronization):** Truy cập lịch học của bạn trên cả thiết bị web và di động.

---

## 🛠️ Hướng dẫn Cài đặt & Thiết lập (PHP & XAMPP)
Ứng dụng này yêu cầu một môi trường phát triển cục bộ. Chúng tôi sử dụng **ngôn ngữ lập trình PHP** cho logic backend và **XAMPP** để cung cấp máy chủ Apache và cơ sở dữ liệu MySQL.

### Cần thiết
1.  **XAMPP:** Tải xuống và cài đặt XAMPP (cho Windows, Mac hoặc Linux) từ trang web chính thức của Apache Friends.
2.  **Trình duyệt Web:** Bất kỳ trình duyệt web hiện đại nào (Chrome, Firefox, Edge, v.v.).

### Các bước Cài đặt
1.  **Khởi động XAMPP:** Mở Bảng điều khiển XAMPP (XAMPP Control Panel) và khởi động các dịch vụ **Apache** và **MySQL**.
2.  **Clone Kho Mã nguồn (Repository):** Điều hướng đến thư mục gốc của web XAMPP (thường là `C:\xampp\htdocs\` hoặc `/Applications/XAMPP/htdocs/`) và clone dự án:
    ```bash
    git clone git@github.com:Tadataka-Rei/Study-Schedule-Management-System.git
    ```
3.  **Thiết lập Cơ sở Dữ liệu (Database Setup):**
    * Mở trình duyệt web và truy cập `http://localhost/phpmyadmin`.
    * Tạo một cơ sở dữ liệu mới với tên **`study_schedule_db`**.
    * Import tệp cơ sở dữ liệu được cung cấp (ví dụ: `study_schedule_db.sql`) nằm trong thư mục gốc của dự án.
4.  **Cấu hình Kết nối:**
    * Mở tệp cấu hình cơ sở dữ liệu (ví dụ: `config/db.php`).
    * Xác minh thông tin đăng nhập cơ sở dữ liệu (mặc định của XAMPP là User: `root`, Password: ``).
5.  **Tru cập Ứng dụng:** Mở trình duyệt web và điều hướng đến:
    ```
    http://localhost/study-schedule/
    ```

    ---
    ---
    # Study Schedule Management System

## 🌟 Overview
This system is designed to help students, educators, and institutions effectively **organize, track, and manage all academic activities**. It serves as a centralized digital planner for classes, assignments, exams, and study sessions, ensuring users stay on top of their commitments and deadlines.

---

## ✨ Key Features
* **Dynamic Timetable Creation:** Easily create and view weekly or semester-long class schedules.
* **Assignment & Task Tracker:** Log homework, projects, and study goals with customizable deadlines.
* **Automated Reminders:** Receive notifications for upcoming classes and critical submission deadlines.
* **Grade/Progress Monitoring:** Track scores and academic performance across different subjects.
* **Multi-Platform Synchronization:** Access your schedule across web and mobile devices.

---

## 🛠️ Installation & Setup (PHP & XAMPP)
This application requires a local development environment. We use **PHP** for the backend logic and **XAMPP** to provide the Apache server and MySQL database.

### Prerequisites
1.  **XAMPP:** Download and install XAMPP (for Windows, Mac, or Linux) from the official Apache Friends website.
2.  **Web Browser:** Any modern web browser (Chrome, Firefox, Edge, etc.).

### Installation Steps
1.  **Start XAMPP:** Launch the XAMPP Control Panel and start the **Apache** and **MySQL** services.
2.  **Clone the Repository:** Navigate to the XAMPP web root directory (usually `C:\xampp\htdocs\` or `/Applications/XAMPP/htdocs/`) and clone the project:
    ```bash
    git clone git@github.com:Tadataka-Rei/Study-Schedule-Management-System.git
    ```
3.  **Database Setup:**
    * Open your web browser and go to `http://localhost/phpmyadmin`.
    * Create a new database named **`study_schedule_db`**.
    * Import the provided database file (e.g., `study_schedule_db.sql`) located in the project's root folder.
4.  **Configure Connection:**
    * Open the database configuration file (e.g., `config/db.php`).
    * Verify the database credentials (default for XAMPP is User: `root`, Password: ``).
5.  **Access the Application:** Open your web browser and navigate to:
    ```
    http://localhost/study-schedule/
    ```
