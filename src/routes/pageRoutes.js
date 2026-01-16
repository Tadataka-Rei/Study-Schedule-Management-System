const express = require('express');
const { 
  showAdminDashboard, 
  showTeacherDashboard, 
  showStudentDashboard, 
  redirectToDashboard 
} = require('../controllers/pageController');

const router = express.Router();

router.get('/', redirectToDashboard);

module.exports = router;
