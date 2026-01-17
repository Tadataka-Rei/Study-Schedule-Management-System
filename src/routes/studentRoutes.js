const express = require('express');
const {
  showStudentDashboard,
  showStudentCourses,
  showStudentSchedule,
  showStudentGrades,
  showStudentAttendance,
  showStudentEnroll
} = require('../controllers/pageController');
const {
  getAvailableCourses,
  enrollInCourse,
  getMyEnrollments,
  getMyGrades,
  getTimetable,
  getAttendance,
  getStudentDashboardData,
  getTodayEvents,
  getUpcomingDeadlines
} = require('../controllers/studentController');

const router = express.Router();

// Page Routes (HTML)
router.get('/dashboard', showStudentDashboard);
router.get('/courses', showStudentCourses);
router.get('/schedule', getTimetable);
router.get('/grades', showStudentGrades);
router.get('/attendance', showStudentAttendance);
router.get('/enroll', showStudentEnroll);

// API Routes (JSON)
router.get('/courses/data', getAvailableCourses);
router.get('/enrollments', getMyEnrollments);
router.get('/grades/data', getMyGrades);
router.get('/schedule/data', getTimetable);
router.get('/attendance/data', getAttendance);
router.get('/stats', getStudentDashboardData);
router.get('/today-events', getTodayEvents);
router.get('/upcoming-deadlines', getUpcomingDeadlines);

router.post('/enroll', enrollInCourse);
module.exports = router;
