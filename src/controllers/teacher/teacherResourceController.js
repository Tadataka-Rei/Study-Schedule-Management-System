const { Course, User, Registration, Submission, Assessment, TimetableEvent, Room, Semester, Attendance } = require('../../models');

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

module.exports = {
  getRooms,
  getSemesters
};
