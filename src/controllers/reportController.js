const { User, Course, Semester, Registration, TimetableEvent } = require('../models');
const path = require('path');

// Show reports dashboard
const showReportsDashboard = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/pages/admin/reports/dashboard.html'));
};

// Generate enrollment report
const generateEnrollmentReport = async (req, res) => {
  try {
    const { semesterId } = req.query;
    
    let matchStage = {};
    if (semesterId) {
      matchStage.semesterId = semesterId;
    }
    
    // Get enrollment statistics
    const enrollmentStats = await Registration.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get course enrollments
    const courseEnrollments = await Registration.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$courseId',
          totalEnrollments: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      { $sort: { totalEnrollments: -1 } }
    ]);
    
    // Get student enrollment counts
    const studentEnrollments = await Registration.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$studentId',
          enrollmentCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 20 }
    ]);
    
    res.json({
      success: true,
      report: {
        type: 'enrollment',
        generatedAt: new Date(),
        stats: enrollmentStats,
        courseEnrollments,
        studentEnrollments
      }
    });
    
  } catch (error) {
    console.error('Error generating enrollment report:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate enrollment report' 
    });
  }
};

// Generate course report
const generateCourseReport = async (req, res) => {
  try {
    const { semesterId } = req.query;
    
    let matchStage = {};
    if (semesterId) {
      matchStage.semesterId = semesterId;
    }
    
    // Get course statistics
    const courses = await Course.find(matchStage)
      .populate('ownerLecturerId', 'profile.fullName profile.email')
      .populate('semesterId', 'name')
      .sort({ code: 1 });
    
    // Calculate total capacity and enrollment
    let totalCapacity = 0;
    let totalEnrolled = 0;
    
    courses.forEach(course => {
      course.sections.forEach(section => {
        totalCapacity += section.capacity;
        totalEnrolled += section.enrolledCount;
      });
    });
    
    // Get courses by lecturer
    const coursesByLecturer = await Course.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$ownerLecturerId',
          courseCount: { $sum: 1 },
          totalSections: { $sum: { $size: '$sections' } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'lecturer'
        }
      },
      { $unwind: '$lecturer' },
      { $sort: { courseCount: -1 } }
    ]);
    
    res.json({
      success: true,
      report: {
        type: 'course',
        generatedAt: new Date(),
        summary: {
          totalCourses: courses.length,
          totalCapacity,
          totalEnrolled,
          averageEnrollment: totalCapacity > 0 ? (totalEnrolled / totalCapacity * 100).toFixed(2) : 0
        },
        courses,
        coursesByLecturer
      }
    });
    
  } catch (error) {
    console.error('Error generating course report:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate course report' 
    });
  }
};

// Generate user report
const generateUserReport = async (req, res) => {
  try {
    // Get user statistics by role
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get all users with details
    const users = await User.find()
      .select('role profile.fullName profile.email profile.phone profile.studentId profile.lecturerId')
      .sort({ 'profile.fullName': 1 });
    
    // Get active users (users with enrollments)
    const activeUsers = await Registration.distinct('studentId');
    
    res.json({
      success: true,
      report: {
        type: 'user',
        generatedAt: new Date(),
        summary: {
          totalUsers: users.length,
          activeUsers: activeUsers.length,
          roleStats: userStats
        },
        users
      }
    });
    
  } catch (error) {
    console.error('Error generating user report:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate user report' 
    });
  }
};

// Generate timetable report
const generateTimetableReport = async (req, res) => {
  try {
    const { semesterId, startDate, endDate } = req.query;
    
    let matchStage = {};
    if (semesterId) {
      matchStage.semesterId = semesterId;
    }
    if (startDate && endDate) {
      matchStage.startAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Get timetable events
    const events = await TimetableEvent.find(matchStage)
      .populate('courseId', 'code name')
      .populate('roomId', 'code building')
      .populate('semesterId', 'name')
      .sort({ startAt: 1 });
    
    // Get events by type
    const eventsByType = await TimetableEvent.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get room utilization
    const roomUtilization = await require('../models/all_models').TimetableEvent.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$roomId',
          usageCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'rooms',
          localField: '_id',
          foreignField: '_id',
          as: 'room'
        }
      },
      { $unwind: '$room' },
      { $sort: { usageCount: -1 } }
    ]);
    
    res.json({
      success: true,
      report: {
        type: 'timetable',
        generatedAt: new Date(),
        summary: {
          totalEvents: events.length,
          eventsByType
        },
        events,
        roomUtilization
      }
    });
    
  } catch (error) {
    console.error('Error generating timetable report:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate timetable report' 
    });
  }
};

// Get available semesters for reports
const getReportSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find()
      .select('_id name startDate endDate')
      .sort({ name: 1 });
    
    res.json({ success: true, semesters });
  } catch (error) {
    console.error('Error fetching semesters:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch semesters' 
    });
  }
};

module.exports = {
  showReportsDashboard,
  generateEnrollmentReport,
  generateCourseReport,
  generateUserReport,
  generateTimetableReport,
  getReportSemesters
};
