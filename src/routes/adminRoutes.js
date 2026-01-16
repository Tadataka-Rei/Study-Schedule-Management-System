const express = require('express');
const { showAdminDashboard } = require('../controllers/pageController');
const { getDashboardStats } = require('../controllers/dashboardController');
const {
  showUsers,
  showCreateUserForm,
  showUsersList,
  createUser,
  showEditUserForm,
  updateUser,
  deleteUser
} = require('../controllers/adminController');
const {
  showCourses,
  showCreateCourseForm,
  showCoursesList,
  createCourse,
  getCourseFormData,
  showEditCourseForm,
  getCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/courseController');
const {
  showSemesters,
  showCreateSemesterForm,
  showSemestersList,
  createSemester,
  showEditSemesterForm,
  getSemester,
  updateSemester,
  deleteSemester
} = require('../controllers/semesterController');
const {
  showReportsDashboard,
  generateEnrollmentReport,
  generateCourseReport,
  generateUserReport,
  generateTimetableReport,
  getReportSemesters
} = require('../controllers/reportController');

const router = express.Router();

// Dashboard
router.get('/dashboard', showAdminDashboard);
router.get('/dashboard/stats', getDashboardStats);

// User Management
router.get('/users', showUsersList);
router.get('/users/list', showUsers);
router.get('/users/new', showCreateUserForm);
router.post('/users', createUser);
router.get('/users/:id/edit', showEditUserForm);
router.get('/users/:id', showUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Course Management
router.get('/courses', showCoursesList);
router.get('/courses/list', showCourses);
router.get('/courses/new', showCreateCourseForm);
router.post('/courses', createCourse);
router.get('/courses/form-data', getCourseFormData);
router.get('/courses/:id/edit', showEditCourseForm);
router.get('/courses/:id', getCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Semester Management
router.get('/semesters', showSemestersList);
router.get('/semesters/list', showSemesters);
router.get('/semesters/new', showCreateSemesterForm);
router.post('/semesters', createSemester);
router.get('/semesters/:id/edit', showEditSemesterForm);
router.get('/semesters/:id', getSemester);
router.put('/semesters/:id', updateSemester);
router.delete('/semesters/:id', deleteSemester);

// Reports
router.get('/reports', showReportsDashboard);
router.get('/reports/enrollments', generateEnrollmentReport);
router.get('/reports/courses', generateCourseReport);
router.get('/reports/users', generateUserReport);
router.get('/reports/timetable', generateTimetableReport);
router.get('/reports/semesters', getReportSemesters);

module.exports = router;
