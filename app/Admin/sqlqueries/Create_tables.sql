USE app_db;
-- Users Table
CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Teacher', 'Student', 'Individual') NOT NULL,
    profile_pic_url VARCHAR(512) NULL COMMENT 'URL to the image stored in object storage',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses Table
CREATE TABLE Courses (
    course_id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    course_content TEXT,
    passkey VARCHAR(50) NULL,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    thumbnail_url VARCHAR(512) NULL COMMENT 'URL to the course thumbnail image',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (teacher_id) REFERENCES Users(user_id)
        ON DELETE RESTRICT
);

-- User_Courses Table (Enrollment)
CREATE TABLE User_Courses (
    enrollment_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    final_grade VARCHAR(10) NULL COMMENT 'Final grade/score user received for the course (e.g., A+, 95%)',

    UNIQUE KEY (user_id, course_id),
    INDEX idx_course_id (course_id),

    FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id)
        ON DELETE CASCADE
);

--  Time_Tables Table (Schedule Container)
CREATE TABLE Time_Tables (
    timetable_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL DEFAULT 'Main Schedule',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE
);

--  Schedules Table (One-off Events)
CREATE TABLE Schedules (
    schedule_id INT PRIMARY KEY AUTO_INCREMENT,
    timetable_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP NOT NULL,
    related_course_id INT NULL COMMENT 'NULL if this is a personal, non-course-related schedule item',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (timetable_id) REFERENCES Time_Tables(timetable_id)
        ON DELETE CASCADE,
    FOREIGN KEY (related_course_id) REFERENCES Courses(course_id)
        ON DELETE SET NULL
);

-- 6. Recurring_Tasks Table
CREATE TABLE Recurring_Tasks (
    recurring_task_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIME NOT NULL,
    duration_minutes INT NOT NULL,
    recurrence_pattern VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL COMMENT 'Date when recurrence starts',
    end_date DATE NULL COMMENT 'Date when recurrence stops (NULL for indefinite)',

    FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE
);

-- Notes Table
CREATE TABLE Notes (
    note_id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    author_id INT NULL COMMENT 'NULL for fixed teacher content',
    note_content TEXT NOT NULL,
    title VARCHAR(255),
    is_teacher_content BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (course_id) REFERENCES Courses(course_id)
        ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES Users(user_id)
        ON DELETE CASCADE
);

-- 8. Files Table

CREATE TABLE Files (
    file_id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    uploader_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) COMMENT 'e.g., application/pdf, image/jpeg',
    file_url VARCHAR(512) NOT NULL COMMENT 'URL to the file in object storage',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (course_id) REFERENCES Courses(course_id)
        ON DELETE CASCADE,
    FOREIGN KEY (uploader_id) REFERENCES Users(user_id)
        ON DELETE RESTRICT
);

-- Assignments Table (Course Level)
CREATE TABLE Assignments (
    assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    official_due_date TIMESTAMP NOT NULL,
    max_points DECIMAL(5, 2) NOT NULL DEFAULT 100.00,
    created_by_id INT NOT NULL,

    FOREIGN KEY (course_id) REFERENCES Courses(course_id)
        ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES Users(user_id)
        ON DELETE RESTRICT
);

-- User_Assignments Table (Student Tracking)

CREATE TABLE User_Assignments (
    user_assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    assignment_id INT NOT NULL,
    user_id INT NOT NULL,
    submission_url VARCHAR(512) NULL COMMENT 'Link to the student submission file',
    submitted_at TIMESTAMP NULL,
    grade DECIMAL(5, 2) NULL COMMENT 'Score given by the teacher',
    status ENUM('Pending', 'Submitted', 'Graded', 'Overdue') NOT NULL DEFAULT 'Pending',
    user_reminder_datetime TIMESTAMP NULL,

    UNIQUE KEY (assignment_id, user_id),

    FOREIGN KEY (assignment_id) REFERENCES Assignments(assignment_id)
        ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE
);