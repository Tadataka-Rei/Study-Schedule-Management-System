const { Course, User, Registration, Submission, Assessment, TimetableEvent, Room, Semester } = require('../models');
const path = require('path');

// Get courses taught by the current lecturer
const getMyCourses = async (req, res) => {
  try {
    const lecturerId = req.session.user.id;

    // Check if request is for JSON (API call) or HTML (page load)
    const isJsonRequest = req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'));

    if (isJsonRequest) {
      const courses = await Course.find({ ownerLecturerId: lecturerId })
        .populate('semesterId', 'name')
        .populate('scheduleTemplate.roomId', 'code building')
        .sort({ code: 1 });

      res.json({ success: true, courses });
    } else {
      // Serve the HTML page
      res.sendFile(path.join(__dirname, '../views/pages/teacher/courses.html'));
    }
  } catch (error) {
    console.error('Error fetching courses:', error);
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      res.status(500).json({ success: false, error: 'Failed to fetch courses' });
    } else {
      res.status(500).send('Error loading courses page');
    }
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

// Update a course owned by the lecturer
const updateMyCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { scheduleTemplate, policies } = req.body;
    const lecturerId = req.session.user.id;

    // Verify the course belongs to this lecturer
    const course = await Course.findOne({
      _id: courseId,
      ownerLecturerId: lecturerId
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found or access denied' });
    }

    // Update scheduleTemplate if provided
    if (scheduleTemplate && Array.isArray(scheduleTemplate)) {
      course.scheduleTemplate = scheduleTemplate.map(item => ({
        dayOfWeek: parseInt(item.dayOfWeek),
        startTime: item.startTime,
        endTime: item.endTime,
        roomId: item.roomId
      }));
    }

    // Update policies if provided
    if (policies) {
      course.policies = {
        addDropDeadline: policies.addDropDeadline ? new Date(policies.addDropDeadline) : course.policies.addDropDeadline,
        attendanceWeight: policies.attendanceWeight !== undefined ? parseFloat(policies.attendanceWeight) : course.policies.attendanceWeight,
        gradingSchema: policies.gradingSchema || course.policies.gradingSchema
      };
    }

    await course.save();

    res.json({ success: true, message: 'Course updated successfully' });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ success: false, error: 'Failed to update course' });
  }
};

// Get all rooms
const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().select('_id code building').sort({ code: 1 });
    res.json({ success: true, rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch rooms' });
  }
};

// Get all semesters
const getSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find().select('_id name').sort({ name: 1 });
    res.json({ success: true, semesters });
  } catch (error) {
    console.error('Error fetching semesters:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch semesters' });
  }
};

// Get course edit page
const getCourseEditPage = async (req, res) => {
  try {
    const { id } = req.query;
    const lecturerId = req.session.user.id;

    // Verify the course belongs to this lecturer
    const course = await Course.findOne({
      _id: id,
      ownerLecturerId: lecturerId
    }).populate('semesterId', 'name').populate('scheduleTemplate.roomId', 'code building');

    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found or access denied' });
    }

    // Check if request is for JSON (API call) or HTML (page load)
    const isJsonRequest = req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'));

    if (isJsonRequest) {
      res.json({ success: true, course });
    } else {
      // Serve the HTML page
      res.sendFile(path.join(__dirname, '../views/pages/teacher/courses/edit.html'));
    }
  } catch (error) {
    console.error('Error fetching course edit page:', error);
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      res.status(500).json({ success: false, error: 'Failed to fetch course' });
    } else {
      res.status(500).send('Error loading course edit page');
    }
  }
};

module.exports = {
  getMyCourses,
  getCourseStudents,
  getCourseAssessments,
  gradeSubmission,
  updateMyCourse,
  getRooms,
  getSemesters,
  getTimetable,
  getCourseEditPage
};
