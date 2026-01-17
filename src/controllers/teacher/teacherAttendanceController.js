const { Course, User, Registration, Submission, Assessment, TimetableEvent, Room, Semester, Attendance } = require('../../models');
const mongoose = require('mongoose');
const path = require('path');

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
    res.sendFile(path.join(__dirname, '../../views/pages/teacher/attendance/take.html'));
  } catch (error) {
    console.error('Error loading take attendance page:', error);
    res.status(500).send('Error loading take attendance page');
  }
};

module.exports = {
  getTodaysCourses,
  getAttendanceForm,
  submitAttendance,
  getTakeAttendancePage
};
