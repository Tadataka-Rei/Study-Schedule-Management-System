const { Room } = require('../models');
const path = require('path');

// Show all rooms
const showRooms = async (req, res) => {
  try {
    const rooms = await Room.find().sort({ code: 1 });
    res.json({ success: true, rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch rooms' });
  }
};

// Show create room form
const showCreateRoomForm = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/pages/admin/rooms/create.html'));
};

// Show rooms list page
const showRoomsList = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/pages/admin/rooms/list.html'));
};

// Create new room
const createRoom = async (req, res) => {
  try {
    const { code, building, capacity, features } = req.body;

    // Check if room already exists
    const existingRoom = await Room.findOne({ code });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        error: 'Room with this code already exists'
      });
    }

    // Parse features as array
    const featuresArray = features ? features.split(',').map(f => f.trim()).filter(f => f) : [];

    const roomData = {
      code,
      building,
      capacity: parseInt(capacity),
      features: featuresArray
    };

    const room = await Room.create(roomData);

    res.json({
      success: true,
      message: 'Room created successfully',
      room: {
        id: room._id,
        code: room.code,
        building: room.building,
        capacity: room.capacity,
        features: room.features
      }
    });

  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create room'
    });
  }
};

module.exports = {
  showRooms,
  showCreateRoomForm,
  showRoomsList,
  createRoom
};
