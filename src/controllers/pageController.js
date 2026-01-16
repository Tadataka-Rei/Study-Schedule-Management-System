const path = require('path');

const showAdminDashboard = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/pages/admin/dashboard.html'));
};

const showTeacherDashboard = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/pages/teacher/dashboard.html'));
};

const showStudentDashboard = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/pages/student/dashboard.html'));
};

const showStudentCourses = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/pages/student/courses.html'));
};

const showStudentSchedule = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/pages/student/schedule.html'));
};

const showStudentGrades = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/pages/student/grades.html'));
};

const showStudentAttendance = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/pages/student/attendance.html'));
};

const showStudentEnroll = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/pages/student/enroll.html'));
};

const redirectToDashboard = (req, res) => {
  const userRole = req.session.user.role;
  
  switch (userRole) {
    case 'admin':
      res.redirect('/admin/dashboard');
      break;
    case 'lecturer':
      res.redirect('/teacher/dashboard');
      break;
    case 'student':
      res.redirect('/student/dashboard');
      break;
    default:
      res.status(403).send('Access denied');
  }
};

module.exports = {
  showAdminDashboard,
  showTeacherDashboard,
  showStudentDashboard,
  redirectToDashboard,
  showStudentEnroll,
  showStudentCourses,
  showStudentSchedule,
  showStudentGrades,
  showStudentAttendance
};
