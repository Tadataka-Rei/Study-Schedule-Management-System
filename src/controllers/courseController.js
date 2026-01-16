const { Course, User, Semester } = require('../models');
const path = require('path');

// Show all courses
const showCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('ownerLecturerId', 'profile.fullName profile.email')
      .populate('semesterId', 'name')
      .sort({ code: 1 });
    
    res.json({ success: true, courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch courses' });
  }
};

// Show create course form
const showCreateCourseForm = async (req, res) => {
  try {
    const lecturers = await User.find({ role: 'lecturer' }).sort({ 'profile.fullName': 1 });
    const semesters = await Semester.find().sort({ name: 1 });
    
    // Pass data to the template (we'll use JavaScript to load it)
    res.sendFile(path.join(__dirname, '../views/pages/admin/courses/create.html'));
  } catch (error) {
    console.error('Error loading course form:', error);
    res.status(500).send('Error loading course form');
  }
};

// Show courses list page
const showCoursesList = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/pages/admin/courses/list.html'));
};

// Create new course
const createCourse = async (req, res) => {
  try {
    const { code, name, credits, ownerLecturerId, semesterId, sections } = req.body;
    
    // Check if course code already exists
    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      return res.status(400).json({ 
        success: false, 
        error: 'Course with this code already exists' 
      });
    }
    
    const courseData = {
      code,
      name,
      credits: parseInt(credits),
      ownerLecturerId,
      semesterId
    };
    
    // Add sections if provided
    if (sections && Array.isArray(sections)) {
      courseData.sections = sections.map(section => ({
        sectionId: section.sectionId,
        lecturerId: section.lecturerId,
        capacity: parseInt(section.capacity),
        enrolledCount: 0
      }));
    }
    
    const course = await Course.create(courseData);
    
    res.json({ 
      success: true, 
      message: 'Course created successfully',
      course: {
        id: course._id,
        code: course.code,
        name: course.name,
        credits: course.credits
      }
    });
    
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create course' 
    });
  }
};

// Get lecturers and semesters for form
const getCourseFormData = async (req, res) => {
  try {
    const lecturers = await User.find({ role: 'lecturer' })
      .select('_id profile.fullName profile.email')
      .sort({ 'profile.fullName': 1 });
    
    const semesters = await Semester.find()
      .select('_id name')
      .sort({ name: 1 });
    
    res.json({ 
      success: true, 
      lecturers, 
      semesters 
    });
  } catch (error) {
    console.error('Error fetching course form data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch form data' 
    });
  }
};

// Show edit course form
const showEditCourseForm = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).send('Course not found');
    }
    res.sendFile(path.join(__dirname, '../views/pages/admin/courses/edit.html'));
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).send('Error fetching course');
  }
};

// Get single course data
const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('ownerLecturerId', 'profile.fullName profile.email')
      .populate('semesterId', 'name');
    
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        error: 'Course not found' 
      });
    }
    
    res.json({ success: true, course });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch course' 
    });
  }
};

// Update course
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, credits, ownerLecturerId, semesterId, sections } = req.body;
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        error: 'Course not found' 
      });
    }
    
    // Check if course code is being changed and if it's already taken
    if (code !== course.code) {
      const existingCourse = await Course.findOne({ code });
      if (existingCourse) {
        return res.status(400).json({ 
          success: false, 
          error: 'Course with this code already exists' 
        });
      }
    }
    
    // Update course data
    course.code = code;
    course.name = name;
    course.credits = parseInt(credits);
    course.ownerLecturerId = ownerLecturerId;
    course.semesterId = semesterId;
    
    // Update sections if provided
    if (sections && Array.isArray(sections)) {
      course.sections = sections.map(section => ({
        sectionId: section.sectionId,
        lecturerId: section.lecturerId,
        capacity: parseInt(section.capacity),
        enrolledCount: section.enrolledCount || 0
      }));
    }
    
    await course.save();
    
    res.json({ 
      success: true, 
      message: 'Course updated successfully',
      course: {
        id: course._id,
        code: course.code,
        name: course.name,
        credits: course.credits
      }
    });
    
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update course' 
    });
  }
};

// Delete course
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        error: 'Course not found' 
      });
    }
    
    // Check if course has enrollments (you might want to add this check)
    // For now, we'll allow deletion
    
    await Course.findByIdAndDelete(id);
    
    res.json({ 
      success: true, 
      message: 'Course deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete course' 
    });
  }
};

module.exports = {
  showCourses,
  showCreateCourseForm,
  showCoursesList,
  createCourse,
  getCourseFormData,
  showEditCourseForm,
  getCourse,
  updateCourse,
  deleteCourse
};
