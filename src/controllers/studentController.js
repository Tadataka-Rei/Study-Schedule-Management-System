const { Course, User, Registration, Submission, Assessment, TimetableEvent } = require('../models');
const path = require('path');

// Get available courses for enrollment
const getAvailableCourses = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session || !req.session.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const studentId = req.session.user.id;
    const { semesterId } = req.query;

    console.log('Fetching available courses for student:', studentId);

    // Get courses the student is not already enrolled in
    const enrolledCourseIds = await Registration.find({
      studentId,
      status: { $in: ['pending', 'approved'] }
    }).distinct('courseId');

    console.log('Enrolled course IDs:', enrolledCourseIds);

    let query = {
      _id: { $nin: enrolledCourseIds }
    };

    if (semesterId) {
      query.semesterId = semesterId;
    }

    console.log('Course query:', query);

    const courses = await Course.find(query)
      .populate('ownerLecturerId', 'profile.fullName profile.email')
      .populate('semesterId', 'name')
      .sort({ code: 1 });

    console.log('Found courses:', courses.length);

    res.json({ success: true, courses });
  } catch (error) {
    console.error('Error fetching available courses:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch courses' });
  }
};

// Enroll in a course
const enrollInCourse = async (req, res) => {
  try {
    const { courseId, sectionId } = req.body;
    const studentId = req.session.user.id;

    // 1. Validate course and section exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    const section = course.sections.find(s => s.sectionId === sectionId);
    if (!section) {
      return res.status(404).json({ success: false, error: 'Section not found' });
    }

    // 2. Check Capacity
    if (section.enrolledCount >= section.capacity) {
      return res.status(400).json({ success: false, error: 'Section is full' });
    }

    // 3. Check for existing registration (including pending)
    const existingRegistration = await Registration.findOne({
      studentId,
      courseId,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingRegistration) {
      return res.status(400).json({ success: false, error: 'Already enrolled or pending approval for this course' });
    }

    // 4. Create registration record
    const registration = await Registration.create({
      studentId,
      courseId,
      sectionId,
      semesterId: course.semesterId, // Important: link to the course's semester
      action: 'add',
      status: 'pending' // Usually requires Admin/Lecturer approval
    });

    res.json({
      success: true,
      message: 'Enrollment request submitted successfully!',
      registration
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({ success: false, error: 'Internal server error during enrollment' });
  }
};
// Get student's enrollments
// studentController.js
const getMyEnrollments = async (req, res) => {
  try {
    const studentId = req.session.user.id;

    console.log('Fetching enrollments for student:', studentId);
    console.log('Session user:', req.session.user);

    // Check if student exists
    const student = await User.findById(studentId);
    if (!student) {
      console.log('Student not found');
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    console.log('Student found:', student._id, student.role);

    const enrollments = await Registration.find({
      studentId,
      status: { $in: ['approved', 'pending'] }
    })
    .populate('courseId', 'code name credits')
    .populate('semesterId', 'name')
    .sort({ requestedAt: -1 });

    // Filter out enrollments where the course has been deleted (courseId is null)
    const validEnrollments = enrollments.filter(e => e.courseId);

    console.log('Found enrollments:', enrollments.length);
    console.log('Enrollments data:', enrollments.map(e => ({
      id: e._id,
      courseId: e.courseId,
      semesterId: e.semesterId,
      status: e.status
    })));

    res.json({ success: true, enrollments: validEnrollments });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, error: 'Failed to fetch enrollments' });
  }
};

// Get student's grades
const getMyGrades = async (req, res) => {
  try {
    const studentId = req.session.user.id;

    // Get all submissions with grades
    const submissions = await Submission.find({
      studentId,
      'grade.score': { $exists: true }
    })
    .populate({
      path: 'assessmentId',
      populate: {
        path: 'courseId',
        select: 'code name'
      }
    })
    .sort({ 'assessmentId.deadlineAt': -1 });

    // Group by course
    const gradesByCourse = {};
    submissions.forEach(submission => {
      const courseId = submission.assessmentId.courseId._id.toString();
      if (!gradesByCourse[courseId]) {
        gradesByCourse[courseId] = {
          course: submission.assessmentId.courseId,
          assessments: []
        };
      }
      gradesByCourse[courseId].assessments.push({
        assessment: submission.assessmentId,
        grade: submission.grade
      });
    });

    res.json({ success: true, grades: Object.values(gradesByCourse) });
  } catch (error) {
    console.error('Error fetching grades:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch grades' });
  }
};

// Get student's timetable
const getTimetable = async (req, res) => {
  try {
    const studentId = req.session.user.id;
    const { semesterId, startDate, endDate } = req.query;

    console.log('getTimetable hit. Student:', studentId, 'Query:', req.query);

    // Check if request is for JSON (API call) or HTML (page load)
    const isJsonRequest = req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'));

    if (!isJsonRequest) {
      return res.sendFile(path.join(__dirname, '../views/pages/student/schedule.html'));
    }

    // Get student's approved enrollments with section info
    const registrations = await Registration.find({
      studentId,
      status: 'approved'
    }).select('courseId sectionId');

    if (!registrations || registrations.length === 0) {
      return res.json({ success: true, events: [] });
    }

    // Build query to match specific course AND section pairs
    const sectionMatches = registrations.map(reg => {
      const match = { courseId: reg.courseId };
      // Only filter by sectionId if the student is registered for a specific section
      if (reg.sectionId) {
        match.sectionId = reg.sectionId;
      }
      return match;
    });

    let matchStage = {
      type: 'class',
      $or: sectionMatches
    };

    if (semesterId) matchStage.semesterId = semesterId;
    if (startDate && endDate) {
      matchStage.startAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    console.log('Fetching timetable with query:', JSON.stringify(matchStage));

    const events = await TimetableEvent.find(matchStage)
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

// Get student's attendance
const getAttendance = async (req, res) => {
  try {
    const studentId = req.session.user.id;

    // Get student's enrolled courses
    const enrollments = await Registration.find({
      studentId,
      status: 'approved'
    })
    .populate('courseId', 'code name')
    .populate('semesterId', 'name');

    // For each course, calculate attendance based on timetable events
    const attendanceData = await Promise.all(enrollments.map(async (enrollment) => {
      const totalClasses = await TimetableEvent.countDocuments({
        courseId: enrollment.courseId._id,
        type: 'class'
      });

      // For now, we'll simulate attendance - in a real system, you'd have attendance records
      const attendedClasses = Math.floor(totalClasses * (0.8 + Math.random() * 0.2)); // 80-100% attendance

      return {
        course: enrollment.courseId,
        semester: enrollment.semesterId,
        totalClasses,
        attendedClasses,
        attendancePercentage: totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0
      };
    }));

    res.json({ success: true, attendance: attendanceData });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch attendance' });
  }
};


//student dashboard calculate logic
const getStudentDashboardData = async (req, res) => {
    try {
        const studentId = req.session.user.id;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // 1. Get Enrolled Courses & Total Credits
        // Use Registration model instead of User.enrollments
        const registrations = await Registration.find({
            studentId,
            status: 'approved'
        }).populate('courseId');

        const enrolledCoursesCount = registrations.length;
        const totalCredits = registrations.reduce((sum, r) => {
            return sum + (r.courseId ? (r.courseId.credits || 0) : 0);
        }, 0);

        // 2. Fetch Today's Classes from TimetableEvents
        // Filter by specific sections
        let todayClasses = [];
        if (registrations.length > 0) {
            const sectionMatches = registrations.map(r => {
                const match = { courseId: r.courseId._id };
                if (r.sectionId) {
                    match.sectionId = r.sectionId;
                }
                return match;
            });

            todayClasses = await TimetableEvent.find({
                $or: sectionMatches,
                startAt: { $gte: todayStart, $lte: todayEnd },
                type: 'class'
            }).populate('courseId', 'code name').populate('roomId', 'code');
        }

        /* Old logic removed:
        const enrolledIds = user.enrollments.map(e => e.courseId._id);
        const todayClasses = await TimetableEvent.find({
            courseId: { $in: enrolledIds },
            startAt: { $gte: todayStart, $lte: todayEnd },
            type: 'class'
        }).populate('courseId', 'code name').populate('roomId', 'code'); 
        */

        res.json({
            success: true,
            stats: {
                enrolledCourses: enrolledCoursesCount,
                currentCredits: totalCredits,
                currentGPA: totalCredits > 0 ? (totalCredits/2).toFixed(1) : 'N/A',
            },
            todayClasses: todayClasses.map(event => ({
                time: `${event.startAt.getHours().toString().padStart(2, '0')}:${event.startAt.getMinutes().toString().padStart(2, '0')}`,
                course: `${event.courseId.code} - ${event.courseId.name}`,
                room: event.roomId ? event.roomId.code : 'N/A'
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getStudentStats = async (req, res) => {
    try {
        const studentId = req.session.user.id;

        // 1. Get Approved Registrations
        const registrations = await Registration.find({
            studentId,
            status: 'approved'
        }).populate('courseId');
        
        const enrolledCount = registrations.length;
        const totalCredits = registrations.reduce((sum, r) => sum + (r.courseId ? (r.courseId.credits || 0) : 0), 0);

        // 2. Simple GPA Calculation (Average of graded submissions)
        const gradedSubmissions = await Submission.find({ 
            studentId, 
            'grade.score': { $exists: true } 
        });

        let gpa = 0;
        if (gradedSubmissions.length > 0) {
            const totalScore = gradedSubmissions.reduce((sum, s) => sum + s.grade.score, 0);
            gpa = (totalScore / gradedSubmissions.length).toFixed(1); 
        }

        // 3. Attendance Rate (Placeholder for now based on your model)
        // You could calculate this by checking TimetableEvents vs Attendance Logs
        const attendance = "95%"; 

        res.json({
            success: true,
            stats: {
                enrolledCourses: enrolledCount,
                currentGPA: gpa,
                attendanceRate: attendance,
                currentCredits: totalCredits
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
const getTodayEvents = async (req, res) => {
    try {
        const studentId = req.session.user.id;
        
        // 1. Get approved registrations with sectionId
        const registrations = await Registration.find({
            studentId,
            status: 'approved'
        }).select('courseId sectionId');

        if (registrations.length === 0) return res.json({ success: true, events: [] });

        const sectionMatches = registrations.map(reg => {
            const match = { courseId: reg.courseId };
            if (reg.sectionId) {
                match.sectionId = reg.sectionId;
            }
            return match;
        });

        // 2. Set time range for "Today" (00:00 to 23:59)
        const start = new Date(); start.setHours(0,0,0,0);
        const end = new Date(); end.setHours(23,59,59,999);

        // 3. Find events for those specific sections
        const events = await TimetableEvent.find({
            $or: sectionMatches,
            startAt: { $gte: start, $lte: end },
            type: 'class'
        })
        .populate('courseId', 'code name') // Pull course details
        .populate('roomId', 'code')      // Pull room details
        .sort({ startAt: 1 });

        res.json({ success: true, events });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


const getUpcomingDeadlines = async (req, res) => {
    try {
        const studentId = req.session.user.id;

        // 1. Get IDs of courses the student is officially in
        const enrolledCourseIds = await Registration.find({
            studentId,
            status: 'approved'
        }).distinct('courseId');

        // 2. Find assessments for these courses with deadlines in the future
        const deadlines = await Assessment.find({
            courseId: { $in: enrolledCourseIds },
            deadlineAt: { $gte: new Date() } // Only show deadlines from "now" onwards
        })
        .populate('courseId', 'code') // Get the course code (e.g., CS101)
        .sort({ deadlineAt: 1 })      // Show the soonest deadlines first
        .limit(5);                    // Only show the top 5

        res.json({ success: true, deadlines });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get single assessment details (for students to see the question)
const getAssessmentDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const assessment = await Assessment.findById(id).populate('courseId', 'code name');
        
        if (!assessment) {
            return res.status(404).json({ success: false, error: 'Assessment not found' });
        }

        res.json({ success: true, assessment });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get assessments page
const getAssessmentsPage = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/pages/student/assessments.html'));
};

// Get all assessments for enrolled courses
const getStudentAssessments = async (req, res) => {
    try {
        const studentId = req.session.user.id;

        // 1. Get enrolled courses
        const registrations = await Registration.find({
            studentId,
            status: 'approved'
        }).distinct('courseId');

        // 2. Find assessments for these courses
        const assessments = await Assessment.find({
            courseId: { $in: registrations }
        })
        .populate('courseId', 'code name')
        .sort({ deadlineAt: 1 });

        // 3. Find existing submissions for these assessments
        const submissions = await Submission.find({
            studentId,
            assessmentId: { $in: assessments.map(a => a._id) }
        });

        const submissionMap = {};
        submissions.forEach(sub => {
            submissionMap[sub.assessmentId.toString()] = sub;
        });

        // 4. Merge data
        const data = assessments.map(assessment => {
            const sub = submissionMap[assessment._id.toString()];
            return {
                _id: assessment._id,
                title: assessment.title,
                description: assessment.description,
                type: assessment.type,
                weight: assessment.weight,
                deadlineAt: assessment.deadlineAt,
                course: assessment.courseId,
                status: sub ? 'submitted' : 'pending',
                submission: sub ? {
                    submittedAt: sub.submittedAt,
                    grade: sub.grade,
                    content: sub.content
                } : null
            };
        });

        res.json({ success: true, assessments: data });
    } catch (error) {
        console.error('Error fetching student assessments:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch assessments' });
    }
};

// Submit an assessment
const submitAssessment = async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.session.user.id;
        const { content } = req.body; // Expecting text content or link

        // Upsert submission
        const submission = await Submission.findOneAndUpdate(
            { studentId, assessmentId: id },
            {
                $set: { content, submittedAt: new Date() }
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json({ success: true, message: 'Assessment submitted successfully', submission });
    } catch (error) {
        console.error('Error submitting assessment:', error);
        res.status(500).json({ success: false, error: 'Failed to submit assessment' });
    }
};

module.exports = {
  getAvailableCourses,
  enrollInCourse,
  getMyEnrollments,
  getMyGrades,
  getTimetable,
  getAttendance,
  getStudentDashboardData,
  getTodayEvents,
  getUpcomingDeadlines,
  getStudentStats,
  getAssessmentDetails,
  getAssessmentsPage,
  getStudentAssessments,
  submitAssessment
};
