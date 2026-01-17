const { Course, User, Registration, Submission, Assessment, TimetableEvent, Room, Semester, Attendance } = require('../../models');

// Get lecturer's timetable
const getTimetable = async (req, res) => {
  try {
    const lecturerId = req.session.user.id;
    const { semesterId, startDate, endDate } = req.query;

    let matchStage = { type: 'class' };
    if (semesterId) matchStage.semesterId = semesterId;
    if (startDate && endDate) {
      matchStage.startAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Find courses taught by this lecturer
    const lecturerCourses = await Course.find({ ownerLecturerId: lecturerId }).select('_id');

    // Get timetable events for these courses
    const events = await TimetableEvent.find({
      ...matchStage,
      courseId: { $in: lecturerCourses.map(c => c._id) }
    })
    .populate('courseId', 'code name')
    .populate('roomId', 'code building')
    .populate('semesterId', 'name')
    .sort({ startAt: 1 });

    res.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch timetable' });
  }
};

module.exports = {
  getTimetable
};
