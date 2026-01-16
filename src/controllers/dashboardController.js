const { User, Course, Semester, Registration } = require('../models');

const getDashboardStats = async (req, res) => {
  try {
    // Get statistics from database
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const activeSemesters = await Semester.countDocuments();
    const totalEnrollments = await Registration.countDocuments();
    
    // Get users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get courses by semester
    const coursesBySemester = await Course.aggregate([
      {
        $group: {
          _id: '$semesterId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'semesters',
          localField: '_id',
          foreignField: '_id',
          as: 'semester'
        }
      },
      { $unwind: '$semester' }
    ]);
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        totalCourses,
        activeSemesters,
        totalEnrollments,
        usersByRole,
        coursesBySemester
      }
    });
    
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard statistics' 
    });
  }
};

module.exports = {
  getDashboardStats
};
