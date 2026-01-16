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
  getCourseEditPage
} = require('../controllers/teacherController');

const router = express.Router();

// Dashboard
router.get('/dashboard', showTeacherDashboard);

// Course Management
router.get('/courses', getMyCourses);
router.get('/courses/edit', getCourseEditPage);
router.put('/courses/:courseId', updateMyCourse);

// Student Management & Grading
router.get('/courses/:courseId/:sectionId/students', getCourseStudents);
router.get('/courses/:courseId/assessments', getCourseAssessments);
router.post('/submissions/:submissionId/grade', gradeSubmission);

// Resources
router.get('/rooms', getRooms);
router.get('/semesters', getSemesters);

// Timetable
router.get('/timetable', getTimetable);

module.exports = router;
