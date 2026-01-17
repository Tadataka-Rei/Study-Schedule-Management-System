const { Course, User, Registration, Submission, Assessment, TimetableEvent, Room, Semester, Attendance } = require('../../models');
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
      res.sendFile(path.join(__dirname, '../../views/pages/teacher/courses.html'));
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

// Update a course owned by the lecturer
const updateMyCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const lecturerId = req.session.user.id;

    // DEBUG LOGS - Check these in your terminal
    console.log("--- Course Update Debug ---");
    console.log("Target Course ID:", courseId);
    console.log("Teacher ID from Session:", lecturerId);

    // 1. Try finding by ID only first to see if it even exists
    const checkExist = await Course.findById(courseId);
    if (!checkExist) {
        console.log("Error: Course ID does not exist in DB at all.");
        return res.status(404).json({ success: false, error: 'Course ID not found' });
    }

    // 2. Now check if the owner matches
    // Note: Use .toString() to compare IDs safely
    if (checkExist.ownerLecturerId.toString() !== lecturerId.toString()) {
        console.log("Error: Ownership mismatch!");
        console.log("DB Owner:", checkExist.ownerLecturerId);
        console.log("Session User:", lecturerId);
        return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // If we passed the checks, perform the update
    const { scheduleTemplate, policies } = req.body;

    // Update logic
    if (scheduleTemplate) {
      checkExist.scheduleTemplate = scheduleTemplate.map(item => ({
        dayOfWeek: parseInt(item.dayOfWeek),
        startTime: item.startTime,
        endTime: item.endTime,
        roomId: item.roomId && item.roomId !== "" ? item.roomId : null
      }));
    }

    if (policies) {
      checkExist.policies = {
        addDropDeadline: policies.addDropDeadline ? new Date(policies.addDropDeadline) : checkExist.policies.addDropDeadline,
        attendanceWeight: policies.attendanceWeight !== undefined ? parseFloat(policies.attendanceWeight) : checkExist.policies.attendanceWeight,
        gradingSchema: (typeof policies.gradingSchema === 'string')
                        ? JSON.parse(policies.gradingSchema)
                        : policies.gradingSchema
      };
    }

    // Sync sections
    if (checkExist.sections && checkExist.sections.length > 0) {
        checkExist.sections.forEach(section => {
            section.schedule = checkExist.scheduleTemplate;
        });
    }

    await checkExist.save();
    res.json({ success: true, message: 'Course updated successfully' });

  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ success: false, error: error.message });
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
      res.sendFile(path.join(__dirname, '../../views/pages/teacher/courses/edit.html'));
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

// Get pending enrollment requests for courses owned by the lecturer
const getPendingEnrollments = async (req, res) => {
  try {
    const lecturerId = req.session.user.id;

    // Check if request is for JSON (API call) or HTML (page load)
    const isJsonRequest = req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'));

    if (isJsonRequest) {
      // Find courses owned by this lecturer
      const lecturerCourses = await Course.find({ ownerLecturerId: lecturerId }).select('_id code name');

      // Get pending registrations for these courses
      const pendingRegistrations = await Registration.find({
        courseId: { $in: lecturerCourses.map(c => c._id) },
        status: 'pending'
      })
      .populate('studentId', 'profile.fullName profile.email profile.studentId')
      .populate('courseId', 'code name')
      .populate('semesterId', 'name')
      .sort({ requestedAt: 1 });

      res.json({ success: true, registrations: pendingRegistrations });
    } else {
      // Serve the HTML page
      res.sendFile(path.join(__dirname, '../../views/pages/teacher/courses/manage.html'));
    }
  } catch (error) {
    console.error('Error fetching pending enrollments:', error);
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      res.status(500).json({ success: false, error: 'Failed to fetch pending enrollments' });
    } else {
      res.status(500).send('Error loading enrollment management page');
    }
  }
};

// Manage enrollment request (approve or reject)
const manageEnrollmentRequest = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    const lecturerId = req.session.user.id;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    // Find the registration and verify access
    const registration = await Registration.findById(registrationId)
      .populate('courseId', 'ownerLecturerId sections');

    if (!registration) {
      return res.status(404).json({ success: false, error: 'Registration not found' });
    }

    // Verify the lecturer owns this course
    if (registration.courseId.ownerLecturerId.toString() !== lecturerId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Update registration status
    registration.status = action === 'approve' ? 'approved' : 'rejected';
    registration.decidedAt = new Date();
    await registration.save();

    // If approving, increment enrolledCount for the section
    if (action === 'approve') {
      const course = await Course.findById(registration.courseId._id);
      const section = course.sections.find(s => s.sectionId === registration.sectionId);
      if (section) {
        section.enrolledCount += 1;
        await course.save();
      }
    }

    res.json({ success: true, message: `Enrollment ${action}d successfully` });
  } catch (error) {
    console.error('Error managing enrollment request:', error);
    res.status(500).json({ success: false, error: 'Failed to manage enrollment request' });
  }
};

module.exports = {
  getMyCourses,
  getCourseStudents,
  updateMyCourse,
  getCourseEditPage,
  getPendingEnrollments,
  manageEnrollmentRequest
};
