const { Course, User, Registration, Submission, Assessment, TimetableEvent, Room, Semester, Attendance } = require('../../models');
const mongoose = require('mongoose');
const path = require('path');

const getTeacherDashboardStats = async (req, res) => {
  try {
    const lecturerId = req.session.user.id;

    // Active Courses: courses owned by this lecturer
    const activeCourses = await Course.countDocuments({ ownerLecturerId: lecturerId });

    // Total Students: sum of enrolled students across all courses
    const lecturerCourses = await Course.find({ ownerLecturerId: lecturerId }).select('_id');
    const courseIds = lecturerCourses.map(c => c._id);
    const totalStudents = await Registration.countDocuments({
      courseId: { $in: courseIds },
      status: 'approved'
    });

    // Pending Grades: submissions without grades
    const pendingGrades = await Submission.countDocuments({
      'assessmentId.courseId': { $in: courseIds },
      'grade.score': { $exists: false }
    });

    // Upcoming Classes: classes today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const upcomingClasses = await TimetableEvent.countDocuments({
      courseId: { $in: courseIds },
      type: 'class',
      startAt: { $gte: startOfDay, $lt: endOfDay }
    });

    res.json({
      success: true,
      stats: {
        activeCourses,
        totalStudents,
        pendingGrades,
        upcomingClasses
      }
    });
  } catch (error) {
    console.error('Error fetching teacher dashboard stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
  }
};

// Get teacher's today events
const getTeacherTodayEvents = async (req, res) => {
  try {
    const lecturerId = req.session.user.id;

    // Get courses taught by this lecturer
    const lecturerCourses = await Course.find({ ownerLecturerId: lecturerId }).select('_id');

    // Set time range for today
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);

    // Find events for those courses today
    const events = await TimetableEvent.find({
      courseId: { $in: lecturerCourses.map(c => c._id) },
      startAt: { $gte: start, $lte: end },
      type: 'class'
    })
    .populate('courseId', 'code name')
    .populate('roomId', 'code')
    .sort({ startAt: 1 });

    res.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching teacher today events:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getTeacherDashboardStats,
  getTeacherTodayEvents,
};
