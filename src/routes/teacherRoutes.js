const express = require('express');
const { showTeacherDashboard } = require('../controllers/pageController');
const {
  getMyCourses,
  getCourseStudents,
  updateMyCourse,
  getCourseEditPage,
  getPendingEnrollments,
  manageEnrollmentRequest
} = require('../controllers/teacher/teacherCourseController');
const {
  getCourseAssessments,
  createAssessment,
  gradeSubmission,
  getAllAssessments,
  updateAssessment,
  deleteAssessment,
  getAssessmentSubmissions,
  getEnterGradesPage,
  getAssessmentGrades,
  submitStudentGrade,
  getGradesDashboard
} = require('../controllers/teacher/teacherAssessmentController');
const {
  getTodaysCourses,
  getAttendanceForm,
  submitAttendance,
  getTakeAttendancePage
} = require('../controllers/teacher/teacherAttendanceController');
const { getTimetable } = require('../controllers/teacher/teacherTimetableController');
const { getRooms, getSemesters } = require('../controllers/teacher/teacherResourceController');
const {
  getTeacherDashboardStats,
  getTeacherTodayEvents
} = require('../controllers/teacher/teacherDashboardController');

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
// 1. Route to show the page (The one your browser is looking for)
router.post('/assessments/create', createAssessment);
router.get('/courses/:courseId/:sectionId/students', getCourseStudents);
router.get('/courses/:courseId/assessments', getCourseAssessments);
router.get('/assessments', getAllAssessments);
router.put('/assessments/:id', updateAssessment);
router.delete('/assessments/:id', deleteAssessment);
router.get('/assessments/:assessmentId/submissions', getAssessmentSubmissions);
router.post('/submissions/:submissionId/grade', gradeSubmission);

// Grade Entry
router.get('/grades', getGradesDashboard);
router.get('/grades/enter', getEnterGradesPage);
router.get('/assessments/:assessmentId/grades', getAssessmentGrades);
router.post('/assessments/:assessmentId/grade', submitStudentGrade);

// Resources
router.get('/rooms', getRooms);
router.get('/semesters', getSemesters);

// Timetable
router.get('/timetable', getTimetable);
router.get('/schedule', getTimetable);

// Attendance Management
router.get('/attendance/take', getTakeAttendancePage);
router.get('/attendance/today', getTodaysCourses);
router.get('/attendance/:eventId', getAttendanceForm);
router.post('/attendance/:eventId', submitAttendance);

module.exports = router;
