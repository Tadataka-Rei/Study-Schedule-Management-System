const { Course, User, Registration, Submission, Assessment, TimetableEvent, Room, Semester, Attendance } = require('../models');
const mongoose = require('mongoose');
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

// Get courses with classes today for attendance
const getTodaysCourses = async (req, res) => {
  try {
    const lecturerId = req.session.user.id;
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Find courses taught by this lecturer
    const lecturerCourses = await Course.find({ ownerLecturerId: lecturerId }).select('_id code name');

    // Get today's class events for these courses
    const todaysEvents = await TimetableEvent.find({
      type: 'class',
      courseId: { $in: lecturerCourses.map(c => c._id) },
      startAt: { $gte: startOfDay, $lt: endOfDay }
    })
    .populate('courseId', 'code name')
    .populate('roomId', 'code building')
    .sort({ startAt: 1 });

    res.json({ success: true, events: todaysEvents });
  } catch (error) {
    console.error('Error fetching today\'s courses:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch today\'s courses' });
  }
};

// Get attendance form for a specific class
const getAttendanceForm = async (req, res) => {
  try {
    const { eventId } = req.params;
    const lecturerId = req.session.user.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, error: 'Invalid event ID' });
    }

    // Get the timetable event and verify access
    const event = await TimetableEvent.findById(eventId)
      .populate('courseId', 'code name ownerLecturerId')
      .populate('roomId', 'code building');

    if (!event) {
      return res.status(404).json({ success: false, error: 'Class event not found' });
    }

    // Verify the lecturer owns this course
    if (event.courseId.ownerLecturerId.toString() !== lecturerId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Get enrolled students for this course and section
    const registrations = await Registration.find({
      courseId: event.courseId._id,
      sectionId: event.sectionId,
      status: 'approved'
    }).populate('studentId', 'profile.fullName profile.email profile.studentId');

    // Get existing attendance records for this event
    const existingAttendance = await Attendance.find({ timetableEventId: eventId })
      .select('studentId status notes');

    // Create a map of studentId to attendance status
    const attendanceMap = {};
    existingAttendance.forEach(att => {
      attendanceMap[att.studentId.toString()] = { status: att.status, notes: att.notes };
    });

    // Combine student data with attendance status
    const studentsWithAttendance = registrations.map(reg => ({
      studentId: reg.studentId._id,
      fullName: reg.studentId.profile.fullName,
      email: reg.studentId.profile.email,
      studentId: reg.studentId.profile.studentId,
      status: attendanceMap[reg.studentId._id.toString()]?.status || 'absent',
      notes: attendanceMap[reg.studentId._id.toString()]?.notes || ''
    }));

    res.json({
      success: true,
      event: {
        id: event._id,
        courseCode: event.courseId.code,
        courseName: event.courseId.name,
        room: event.roomId ? `${event.roomId.code} (${event.roomId.building})` : 'TBA',
        startTime: event.startAt,
        endTime: event.endAt
      },
      students: studentsWithAttendance
    });
  } catch (error) {
    console.error('Error fetching attendance form:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch attendance form' });
  }
};

// Submit attendance for a class
const submitAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { attendance } = req.body; // Array of { studentId, status, notes }
    const lecturerId = req.session.user.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, error: 'Invalid event ID' });
    }

    // Verify the event belongs to this lecturer
    const event = await TimetableEvent.findById(eventId)
      .populate('courseId', 'ownerLecturerId');

    if (!event) {
      return res.status(404).json({ success: false, error: 'Class event not found' });
    }

    if (event.courseId.ownerLecturerId.toString() !== lecturerId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Process each attendance record
    const attendancePromises = attendance.map(async (record) => {
      const { studentId, status, notes } = record;

      // Upsert attendance record
      return Attendance.findOneAndUpdate(
        { studentId, timetableEventId: eventId },
        {
          status,
          notes,
          markedBy: lecturerId,
          markedAt: new Date()
        },
        { upsert: true, new: true }
      );
    });

    await Promise.all(attendancePromises);

    res.json({ success: true, message: 'Attendance submitted successfully' });
  } catch (error) {
    console.error('Error submitting attendance:', error);
    res.status(500).json({ success: false, error: 'Failed to submit attendance' });
  }
};

// Get take attendance page
const getTakeAttendancePage = async (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '../views/pages/teacher/attendance/take.html'));
  } catch (error) {
    console.error('Error loading take attendance page:', error);
    res.status(500).send('Error loading take attendance page');
  }
};

// Get teacher dashboard stats
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
  getMyCourses,
  getCourseStudents,
  getCourseAssessments,
  gradeSubmission,
  updateMyCourse,
  getRooms,
  getSemesters,
  getTimetable,
  getCourseEditPage,
  getTodaysCourses,
  getAttendanceForm,
  submitAttendance,
  getTakeAttendancePage,
  getTeacherDashboardStats,
  getTeacherTodayEvents
};
