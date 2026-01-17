# Study Schedule Management System (SSMS)

## Overview

The **Study Schedule Management System (SSMS)** is a comprehensive web-based application designed to streamline academic processes for educational institutions. It facilitates course management, student enrollment, automated timetable generation, assessment handling, grading, and attendance tracking. The system serves three primary roles: **Students**, **Lecturers (Teachers)**, and **Admins**.

## Technical Stack

*   **Runtime Environment**: Node.js
*   **Framework**: Express.js
*   **Database**: MongoDB (via Mongoose ODM)
*   **Frontend**: Server-side rendered HTML, CSS, Vanilla JavaScript (AJAX/Fetch API)
*   **Authentication**: Session-based authentication (`express-session`)
*   **Configuration**: Environment variables (`dotenv`)

## Features

### 1. User Roles & Authentication
*   **Login/Logout**: Secure session management.
*   **Role-Based Access Control (RBAC)**: Middleware ensures users can only access routes authorized for their role (Student, Lecturer, Admin).

### 2. Course Management (Admin/Teacher)
*   **CRUD Operations**: Create, read, update, and delete courses.
*   **Sections & Capacity**: Manage multiple sections per course with defined student capacities.
*   **Schedule Templates**: Define weekly schedules (Day, Start Time, End Time, Room) which automatically generate calendar events for the semester.

### 3. Enrollment System
*   **Student Registration**: Students can browse available courses and request enrollment.
*   **Approval Workflow**: Teachers/Admins review pending enrollment requests to approve or reject them.
*   **Conflict Detection**: (Planned) Checks for time conflicts and capacity limits.

### 4. Timetable & Scheduling
*   **Automated Generation**: Converts course schedule templates into concrete `TimetableEvent` records for specific dates within a semester.
*   **Personalized Views**:
    *   **Students**: View class schedules for enrolled courses.
    *   **Teachers**: View teaching schedules.
*   **Weekly View**: Interactive weekly calendar grid.

### 5. Assessment & Grading
*   **Assessment Creation**: Teachers create Assignments, Quizzes, Midterms, and Finals with weights, deadlines, and descriptions.
*   **Submission**: Students submit work (text or file links) via the portal.
*   **Grading**: Teachers view submissions, enter scores (0-100), and provide feedback.
*   **Grade Reports**: Students view detailed grade breakdowns and calculated GPAs.

### 6. Attendance Tracking
*   **Digital Roll Call**: Teachers mark students as Present, Absent, Late, or Excused for specific class events.
*   **Statistics**: System calculates attendance rates for students.

## Project Structure

The project follows the **MVC (Model-View-Controller)** architectural pattern.

```text
src/
├── controllers/         # Business logic
│   ├── studentController.js       # Student-specific logic (Enrollment, Grades, Schedule)
│   ├── courseController.js        # General course logic
│   ├── pageController.js          # Renders HTML views
│   └── teacher/                   # Teacher-specific logic
│       ├── teacherAssessmentController.js
│       ├── teacherAttendanceController.js
│       ├── teacherCourseController.js
│       └── ...
├── models/              # Mongoose Schemas
│   ├── User.js          # Student/Lecturer profiles
│   ├── Course.js        # Course metadata & sections
│   ├── Registration.js  # Links Students to Courses (Enrollment)
│   ├── Assessment.js    # Tests/Assignments definitions
│   ├── Submission.js    # Student work & Grades
│   ├── TimetableEvent.js# Individual calendar events
│   ├── Attendance.js    # Attendance records
│   └── ...
├── routes/              # Express Route definitions
│   ├── studentRoutes.js
│   ├── teacherRoutes.js
│   └── ...
├── views/               # HTML Templates
│   ├── pages/
│   │   ├── student/     # Student views
│   │   ├── teacher/     # Teacher views
│   │   └── admin/       # Admin views
│   └── js/              # Client-side scripts (auth.js, dashboard.js)
├── App.js               # Application Entry Point
└── init.js              # Database Seeding/Setup Script
```

## Database Schema Overview

*   **User**: Stores credentials, role, and profile info.
*   **Semester**: Defines academic periods (Start Date, End Date).
*   **Course**: Contains code, name, credits, owner (Lecturer), and `sections` array.
*   **Registration**: Join table between `User` (Student) and `Course`. Status: `pending` | `approved` | `rejected`.
*   **TimetableEvent**: Represents a single class session or exam instance on a specific date/time/room.
*   **Assessment**: Defines a task linked to a Course (e.g., "Midterm Exam", Weight: 30%).
*   **Submission**: Stores student content and the resulting grade/feedback for an Assessment.

## Installation & Setup

1.  **Prerequisites**:
    *   Node.js (v14+ recommended)
    *   MongoDB (Local or Atlas connection string)

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Configuration**:
    Create a `.env` file in the root directory:
    ```env
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/ssms
    SESSION_SECRET=your_secret_key_here
    ```

4.  **Database Initialization**:
    Run the setup script to seed initial data (admin user, semesters, rooms, etc.):
    ```bash
    npm run setup
    ```

5.  **Start the Server**:
    ```bash
    npm start
    ```
    Access the application at `http://localhost:3000`.

## API Endpoints (Key Examples)

### Student
*   `GET /student/courses/data`: Fetch available courses.
*   `POST /student/enroll`: Submit enrollment request.
*   `GET /student/schedule/data`: Fetch timetable events (JSON).
*   `GET /student/grades/data`: Fetch grade report.
*   `POST /student/assessments/:id/submit`: Submit assignment.

### Teacher
*   `GET /teacher/courses`: List taught courses.
*   `POST /teacher/assessments/create`: Create new assessment.
*   `GET /teacher/attendance/:eventId`: Get student list for a class.
*   `POST /teacher/attendance/:eventId`: Submit attendance.
*   `POST /teacher/submissions/:id/grade`: Grade a student submission.

## License

ISC