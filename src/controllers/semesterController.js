const { Semester } = require('../models');
const path = require('path');

// Show all semesters
const showSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find().sort({ name: 1 });
    res.json({ success: true, semesters });
  } catch (error) {
    console.error('Error fetching semesters:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch semesters' });
  }
};

// Show create semester form
const showCreateSemesterForm = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/pages/admin/semesters/create.html'));
};

// Show semesters list page
const showSemestersList = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/pages/admin/semesters/list.html'));
};

// Create new semester
const createSemester = async (req, res) => {
  try {
    const { name, startDate, endDate, addStart, addEnd, dropStart, dropEnd } = req.body;
    
    // Check if semester name already exists
    const existingSemester = await Semester.findOne({ name });
    if (existingSemester) {
      return res.status(400).json({ 
        success: false, 
        error: 'Semester with this name already exists' 
      });
    }
    
    const semesterData = {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      registrationWindows: {
        addStart: new Date(addStart),
        addEnd: new Date(addEnd),
        dropStart: new Date(dropStart),
        dropEnd: new Date(dropEnd)
      }
    };
    
    const semester = await Semester.create(semesterData);
    
    res.json({ 
      success: true, 
      message: 'Semester created successfully',
      semester: {
        id: semester._id,
        name: semester.name,
        startDate: semester.startDate,
        endDate: semester.endDate
      }
    });
    
  } catch (error) {
    console.error('Error creating semester:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create semester' 
    });
  }
};

// Show edit semester form
const showEditSemesterForm = async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id);
    if (!semester) {
      return res.status(404).send('Semester not found');
    }
    res.sendFile(path.join(__dirname, '../views/pages/admin/semesters/edit.html'));
  } catch (error) {
    console.error('Error fetching semester:', error);
    res.status(500).send('Error fetching semester');
  }
};

// Get single semester data
const getSemester = async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id);
    
    if (!semester) {
      return res.status(404).json({ 
        success: false, 
        error: 'Semester not found' 
      });
    }
    
    res.json({ success: true, semester });
  } catch (error) {
    console.error('Error fetching semester:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch semester' 
    });
  }
};

// Update semester
const updateSemester = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, addStart, addEnd, dropStart, dropEnd } = req.body;
    
    const semester = await Semester.findById(id);
    if (!semester) {
      return res.status(404).json({ 
        success: false, 
        error: 'Semester not found' 
      });
    }
    
    // Check if semester name is being changed and if it's already taken
    if (name !== semester.name) {
      const existingSemester = await Semester.findOne({ name });
      if (existingSemester) {
        return res.status(400).json({ 
          success: false, 
          error: 'Semester with this name already exists' 
        });
      }
    }
    
    // Update semester data
    semester.name = name;
    semester.startDate = new Date(startDate);
    semester.endDate = new Date(endDate);
    semester.registrationWindows = {
      addStart: new Date(addStart),
      addEnd: new Date(addEnd),
      dropStart: new Date(dropStart),
      dropEnd: new Date(dropEnd)
    };
    
    await semester.save();
    
    res.json({ 
      success: true, 
      message: 'Semester updated successfully',
      semester: {
        id: semester._id,
        name: semester.name,
        startDate: semester.startDate,
        endDate: semester.endDate
      }
    });
    
  } catch (error) {
    console.error('Error updating semester:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update semester' 
    });
  }
};

// Delete semester
const deleteSemester = async (req, res) => {
  try {
    const { id } = req.params;
    
    const semester = await Semester.findById(id);
    if (!semester) {
      return res.status(404).json({ 
        success: false, 
        error: 'Semester not found' 
      });
    }
    
    // Check if semester has courses (you might want to add this check)
    // For now, we'll allow deletion
    
    await Semester.findByIdAndDelete(id);
    
    res.json({ 
      success: true, 
      message: 'Semester deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting semester:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete semester' 
    });
  }
};

module.exports = {
  showSemesters,
  showCreateSemesterForm,
  showSemestersList,
  createSemester,
  showEditSemesterForm,
  getSemester,
  updateSemester,
  deleteSemester
};
