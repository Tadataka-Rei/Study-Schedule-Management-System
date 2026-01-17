const { Course, User, Semester, Room, TimetableEvent } = require('../models');
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

// Helper: Generate Timetable Events for a Course
const generateTimetableEvents = async (course, semester) => {
  const events = [];
  const { startDate, endDate } = semester;

  // Loop through each section in the course
  for (const section of course.sections) {
    if (!section.schedule || section.schedule.length === 0) continue;

    // For each schedule slot (e.g., Monday 08:00-10:00)
    for (const slot of section.schedule) {
      let currentDate = new Date(startDate);
      
      // 1. Advance currentDate to the first occurrence of the specific dayOfWeek
      // slot.dayOfWeek: 0 (Sun) - 6 (Sat)
      while (currentDate.getDay() !== slot.dayOfWeek) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // 2. Generate events for every week until endDate
      while (currentDate <= endDate) {
        // Parse time strings (e.g., "08:00")
        const [startHour, startMinute] = slot.startTime.split(':').map(Number);
        const [endHour, endMinute] = slot.endTime.split(':').map(Number);

        const startAt = new Date(currentDate);
        startAt.setHours(startHour, startMinute, 0, 0);

        const endAt = new Date(currentDate);
        endAt.setHours(endHour, endMinute, 0, 0);

        events.push({
          type: 'class',
          courseId: course._id,
          sectionId: section.sectionId,
          semesterId: semester._id,
          startAt,
          endAt,
          roomId: slot.roomId,
          status: 'scheduled'
        });

        // Move to next week
        currentDate.setDate(currentDate.getDate() + 7);
      }
    }
  }

  if (events.length > 0) {
    await TimetableEvent.insertMany(events);
    console.log(`Generated ${events.length} timetable events for course ${course.code}`);
  }
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
      semesterId,
      scheduleTemplate: [] // Initialize empty
    };

    if (sections && Array.isArray(sections)) {
      courseData.sections = sections.map(section => ({
        sectionId: section.sectionId,
        lecturerId: section.lecturerId || ownerLecturerId, // Fix for the empty string bug
        capacity: parseInt(section.capacity),
        enrolledCount: 0,
        schedule: section.schedule ? section.schedule.map(sched => ({
          dayOfWeek: parseInt(sched.dayOfWeek),
          startTime: sched.startTime,
          endTime: sched.endTime,
          roomId: sched.roomId
        })) : []
      }));

      // AUTO-POPULATE TEMPLATE:
      // Use the schedule from the first section as the course-wide template
      if (courseData.sections.length > 0 && courseData.sections[0].schedule.length > 0) {
        courseData.scheduleTemplate = courseData.sections[0].schedule;
      }
    }

    const course = await Course.create(courseData);

    // Generate actual calendar events for the semester
    const semester = await Semester.findById(semesterId);
    if (semester) {
      await generateTimetableEvents(course, semester);
    }
    
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

// Get lecturers, semesters, and rooms for form
const getCourseFormData = async (req, res) => {
  try {
    const lecturers = await User.find({ role: 'lecturer' })
      .select('_id profile.fullName profile.email')
      .sort({ 'profile.fullName': 1 });

    const semesters = await Semester.find()
      .select('_id name')
      .sort({ name: 1 });

    const rooms = await Room.find()
      .select('_id code building capacity')
      .sort({ code: 1 });

    res.json({
      success: true,
      lecturers,
      semesters,
      rooms
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
        enrolledCount: section.enrolledCount || 0,
        schedule: section.schedule ? section.schedule.map(sched => ({
          dayOfWeek: parseInt(sched.dayOfWeek),
          startTime: sched.startTime,
          endTime: sched.endTime,
          roomId: sched.roomId
        })) : []
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
