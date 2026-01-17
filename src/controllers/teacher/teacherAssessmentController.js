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

module.exports = {
  getCourseAssessments,
  getAllAssessments,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  gradeSubmission,
  getAssessmentSubmissions
};
