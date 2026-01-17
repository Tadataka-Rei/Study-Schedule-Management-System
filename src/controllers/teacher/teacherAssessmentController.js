const { Course, User, Registration, Submission, Assessment, TimetableEvent, Room, Semester, Attendance } = require('../../models');
const mongoose = require('mongoose');
const path = require('path');

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

    // Check if request is for JSON (API call) or HTML (page load)
    const isJsonRequest = req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'));

    if (!isJsonRequest) {
      return res.sendFile(path.join(__dirname, '../../views/pages/teacher/courses/assessments.html'));
    }

    const assessments = await Assessment.find({ courseId }).sort({ deadlineAt: 1 });

    res.json({ success: true, assessments });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      res.status(500).json({ success: false, error: 'Failed to fetch assessments' });
    } else {
      res.status(500).send('Error loading course assessments page');
    }
  }
};

// Get all assessments created by the teacher
const getAllAssessments = async (req, res) => {
  try {
    const lecturerId = req.session.user.id;

    // Check if request is for JSON (API call) or HTML (page load)
    const isJsonRequest = req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'));

    if (!isJsonRequest) {
      return res.sendFile(path.join(__dirname, '../../views/pages/teacher/assessments.html'));
    }

    const assessments = await Assessment.find()
      .populate({
        path: 'courseId',
        match: { ownerLecturerId: lecturerId },
        select: 'code name'
      })
      .sort({ deadlineAt: 1 });

    // Filter out assessments where courseId is null (course not owned by lecturer)
    const filteredAssessments = assessments.filter(assessment => assessment.courseId !== null);

    res.json({ success: true, assessments: filteredAssessments });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
      res.status(500).json({ success: false, error: 'Failed to fetch assessments' });
    } else {
      res.status(500).send('Error loading assessments page');
    }
  }
};

// Create a new assessment for a course
const createAssessment = async (req, res) => {
  try {
    const lecturerId = req.session.user.id;
    let { courseId, sectionId, semesterId, type, title, weight, deadlineAt, submissionPolicy } = req.body;

    if (!courseId) {
      return res.status(400).json({ success: false, error: 'Missing required field: courseId' });
    }

    // Verify the course belongs to this lecturer
    const course = await Course.findOne({
      _id: courseId,
      ownerLecturerId: lecturerId
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found or access denied' });
    }

    // Auto-fill semesterId from the course if not provided
    if (!semesterId && course.semesterId) {
      semesterId = course.semesterId;
    }

    // Check for missing fields and report exactly which one
    const missingFields = [];
    if (!sectionId) missingFields.push('sectionId');
    if (!semesterId) missingFields.push('semesterId');
    if (!type) missingFields.push('type');
    if (!title) missingFields.push('title');
    if (weight === undefined || weight === null || weight === '') missingFields.push('weight');
    if (!deadlineAt) missingFields.push('deadlineAt');

    if (missingFields.length > 0) {
      return res.status(400).json({ success: false, error: `Missing required fields: ${missingFields.join(', ')}` });
    }

    // Validate type enum
    const validTypes = ['assignment', 'quiz', 'midterm', 'final'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid assessment type' });
    }

    // Create the assessment
    const newAssessment = new Assessment({
      courseId,
      sectionId,
      semesterId,
      type,
      title,
      weight: parseFloat(weight),
      deadlineAt: new Date(deadlineAt),
      submissionPolicy: submissionPolicy || { lateAllowed: false, latePenalty: 0 }
    });

    await newAssessment.save();

    res.json({ success: true, message: 'Assessment created successfully', assessment: newAssessment });
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ success: false, error: 'Failed to create assessment' });
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

// Update an existing assessment
const updateAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const lecturerId = req.session.user.id;
    const { courseId, sectionId, semesterId, type, title, weight, deadlineAt, submissionPolicy } = req.body;

    // Validate required fields
    if (!courseId || !sectionId || !semesterId || !type || !title || weight === undefined || !deadlineAt) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Verify the course belongs to this lecturer
    const course = await Course.findOne({
      _id: courseId,
      ownerLecturerId: lecturerId
    });

    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found or access denied' });
    }

    // Verify the assessment exists and belongs to this lecturer
    const assessment = await Assessment.findOne({
      _id: id,
      courseId: courseId
    });

    if (!assessment) {
      return res.status(404).json({ success: false, error: 'Assessment not found' });
    }

    // Validate type enum
    const validTypes = ['assignment', 'quiz', 'midterm', 'final'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid assessment type' });
    }

    // Update the assessment
    assessment.sectionId = sectionId;
    assessment.semesterId = semesterId;
    assessment.type = type;
    assessment.title = title;
    assessment.weight = parseFloat(weight);
    assessment.deadlineAt = new Date(deadlineAt);
    assessment.submissionPolicy = submissionPolicy || { lateAllowed: false, latePenalty: 0 };

    await assessment.save();

    res.json({ success: true, message: 'Assessment updated successfully', assessment });
  } catch (error) {
    console.error('Error updating assessment:', error);
    res.status(500).json({ success: false, error: 'Failed to update assessment' });
  }
};

// Delete an assessment
const deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const lecturerId = req.session.user.id;

    // Find the assessment and verify ownership
    const assessment = await Assessment.findById(id).populate('courseId');

    if (!assessment) {
      return res.status(404).json({ success: false, error: 'Assessment not found' });
    }

    // Verify the lecturer owns the course
    if (assessment.courseId.ownerLecturerId.toString() !== lecturerId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await Assessment.findByIdAndDelete(id);

    res.json({ success: true, message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    res.status(500).json({ success: false, error: 'Failed to delete assessment' });
  }
};

// Get submissions for a specific assessment
const getAssessmentSubmissions = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const lecturerId = req.session.user.id;

    // Find the assessment and verify ownership
    const assessment = await Assessment.findById(assessmentId).populate('courseId');

    if (!assessment) {
      return res.status(404).json({ success: false, error: 'Assessment not found' });
    }

    // Verify the lecturer owns the course
    if (assessment.courseId.ownerLecturerId.toString() !== lecturerId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Get submissions for this assessment
    const submissions = await Submission.find({ assessmentId })
      .populate('studentId', 'profile.fullName profile.email profile.studentId')
      .sort({ submittedAt: 1 });

    res.json({ success: true, submissions });
  } catch (error) {
    console.error('Error fetching assessment submissions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch submissions' });
  }
};

// Get enter grades page
const getEnterGradesPage = async (req, res) => {
  try {
    res.sendFile(path.join(__dirname, '../../views/pages/teacher/grades/enter.html'));
  } catch (error) {
    console.error('Error loading enter grades page:', error);
    res.status(500).send('Error loading enter grades page');
  }
};

// Get students and their grades for a specific assessment
const getAssessmentGrades = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const lecturerId = req.session.user.id;

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ success: false, error: 'Assessment not found' });
    }

    // Verify ownership via course
    const course = await Course.findOne({ _id: assessment.courseId, ownerLecturerId: lecturerId });
    if (!course) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Get students enrolled in the course (and section if specified)
    const query = { courseId: assessment.courseId, status: 'approved' };
    if (assessment.sectionId) {
      query.sectionId = assessment.sectionId;
    }
    
    const registrations = await Registration.find(query)
      .populate('studentId', 'profile.fullName profile.studentId profile.email')
      .sort({ 'studentId.profile.studentId': 1 });

    // Get existing submissions/grades for this assessment
    const submissions = await Submission.find({ assessmentId });
    const submissionMap = {};
    submissions.forEach(sub => {
      submissionMap[sub.studentId.toString()] = sub;
    });

    // Combine registration data with grade data
    const data = registrations.map(reg => {
      const sub = submissionMap[reg.studentId._id.toString()];
      return {
        studentId: reg.studentId._id,
        studentName: reg.studentId.profile.fullName,
        studentCode: reg.studentId.profile.studentId,
        email: reg.studentId.profile.email,
        grade: sub && sub.grade ? sub.grade.score : '',
        feedback: sub && sub.grade ? sub.grade.feedback : '',
        submissionId: sub ? sub._id : null
      };
    });

    res.json({ success: true, students: data, assessmentTitle: assessment.title, maxScore: 100 });
  } catch (error) {
    console.error('Error fetching assessment grades:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch grades' });
  }
};

// Submit a grade for a student (creates submission if missing)
const submitStudentGrade = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { studentId, score, feedback } = req.body;
    const lecturerId = req.session.user.id;

    // Upsert submission record
    const submission = await Submission.findOneAndUpdate(
      { assessmentId, studentId },
      {
        $set: {
          grade: {
            score: parseFloat(score),
            feedback: feedback,
            graderId: lecturerId,
            gradedAt: new Date()
          }
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: 'Grade saved' });
  } catch (error) {
    console.error('Error saving grade:', error);
    res.status(500).json({ success: false, error: 'Failed to save grade' });
  }
};

module.exports = {
  getCourseAssessments,
  getAllAssessments,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  gradeSubmission,
  getAssessmentSubmissions,
  getEnterGradesPage,
  getAssessmentGrades,
  submitStudentGrade
};
