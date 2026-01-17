const express = require('express');
const { showTeacherDashboard } = require('../controllers/pageController');
const {
  getMyCourses,
  getCourseStudents,
  getCourseAssessments,
  gradeSubmission,
  updateMyCourse,
  getRooms,
  getSemesters,
  getTimetable,
  getCourseEditPage,
  getTodaysCourses,
  getAttendanceForm,
  submitAttendance,
  getTakeAttendancePage,
  getTeacherDashboardStats,
  getTeacherTodayEvents,
  getPendingEnrollments,
  manageEnrollmentRequest
} = require('../controllers/teacherController');

const router = express.Router();

// Dashboard
router.get('/dashboard', showTeacherDashboard);
router.get('/dashboard/stats', getTeacherDashboardStats);
router.get('/today-events', getTeacherTodayEvents);

// Course Management
router.get('/courses', getMyCourses);
router.get('/courses/edit', getCourseEditPage);
router.put('/courses/:courseId', updateMyCourse);
router.get('/courses/manage', getPendingEnrollments);
router.post('/courses/manage/:registrationId', manageEnrollmentRequest);

// Student Management & Grading
router.get('/courses/:courseId/:sectionId/students', getCourseStudents);
router.get('/courses/:courseId/assessments', getCourseAssessments);
router.post('/submissions/:submissionId/grade', gradeSubmission);

// Resources
router.get('/rooms', getRooms);
router.get('/semesters', getSemesters);

// Timetable
router.get('/timetable', getTimetable);

// Attendance Management
router.get('/attendance/take', getTakeAttendancePage);
router.get('/attendance/today', getTodaysCourses);
router.get('/attendance/:eventId', getAttendanceForm);
router.post('/attendance/:eventId', submitAttendance);

module.exports = router;
