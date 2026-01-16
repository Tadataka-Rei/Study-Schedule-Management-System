const express = require('express');
const { showTeacherDashboard } = require('../controllers/pageController');
const {
  getMyCourses,
  getCourseStudents,
  getCourseAssessments,
  gradeSubmission,
  getTimetable
} = require('../controllers/teacherController');

const router = express.Router();

// Dashboard
router.get('/dashboard', showTeacherDashboard);

// Course Management
router.get('/courses', getMyCourses);

// Student Management & Grading
router.get('/courses/:courseId/:sectionId/students', getCourseStudents);
router.get('/courses/:courseId/assessments', getCourseAssessments);
router.post('/submissions/:submissionId/grade', gradeSubmission);

// Timetable
router.get('/timetable', getTimetable);

module.exports = router;
