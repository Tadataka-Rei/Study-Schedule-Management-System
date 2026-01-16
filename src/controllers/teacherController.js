const { Course, User, Registration, Submission, Assessment, TimetableEvent } = require('../models');

// Get courses taught by the current lecturer
const getMyCourses = async (req, res) => {
  try {
    const lecturerId = req.session.user.id;

    const courses = await Course.find({ ownerLecturerId: lecturerId })
      .populate('semesterId', 'name')
      .sort({ code: 1 });

    res.json({ success: true, courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch courses' });
  }
};

// Get students enrolled in a specific course section
const getCourseStudents = async (req, res) => {
  try {
    const { courseId, sectionId } = req.params;
    const lecturerId = req.session.user.id;

    // Verify the course belongs to this lecturer
    const course = await Course.findOne({
      _id: courseId,
      ownerLecturerId: lecturerId
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found or access denied' });
    }

    // Get registrations for this course and section
    const registrations = await Registration.find({
      courseId,
      sectionId,
      status: 'approved'
    }).populate('studentId', 'profile.fullName profile.email profile.studentId');

    res.json({ success: true, students: registrations });
  } catch (error) {
    console.error('Error fetching course students:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch students' });
  }
};

// Get assessments for a course
const getCourseAssessments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const lecturerId = req.session.user.id;

    // Verify the course belongs to this lecturer
    const course = await Course.findOne({
      _id: courseId,
      ownerLecturerId: lecturerId
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found or access denied' });
    }

    const assessments = await Assessment.find({ courseId }).sort({ deadlineAt: 1 });

    res.json({ success: true, assessments });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch assessments' });
  }
};

// Grade a student submission
const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { score, feedback } = req.body;
    const lecturerId = req.session.user.id;

    const submission = await Submission.findById(submissionId)
      .populate({
        path: 'assessmentId',
        populate: {
          path: 'courseId',
          select: 'ownerLecturerId'
        }
      });

    if (!submission) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    // Verify the lecturer owns the course
    if (submission.assessmentId.courseId.ownerLecturerId.toString() !== lecturerId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    submission.grade = {
      score: parseFloat(score),
      graderId: lecturerId,
      gradedAt: new Date(),
      feedback
    };

    await submission.save();

    res.json({ success: true, message: 'Grade submitted successfully' });
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({ success: false, error: 'Failed to grade submission' });
  }
};

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
  getMyCourses,
  getCourseStudents,
  getCourseAssessments,
  gradeSubmission,
  getTimetable
};
