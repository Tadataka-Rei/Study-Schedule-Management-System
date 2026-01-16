const { User } = require('../models');
const path = require('path');

// Show all users
const showUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ 'profile.fullName': 1 });
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};

// Get single user
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
};

// Show create user form
const showCreateUserForm = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/pages/admin/users/create.html'));
};

// Show users list page
const showUsersList = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/pages/admin/users/list.html'));
};

// Create new user
const createUser = async (req, res) => {
  try {
    const { role, password, fullName, email, phone, studentId, lecturerId } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 'profile.email': email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User with this email already exists' 
      });
    }
    
    // Build user object
    const userData = {
      role,
      password,
      profile: {
        fullName,
        email,
        phone
      }
    };
    
    // Add role-specific IDs
    if (role === 'student' && studentId) {
      userData.profile.studentId = studentId;
    }
    if (role === 'lecturer' && lecturerId) {
      userData.profile.lecturerId = lecturerId;
    }
    
    const user = await User.create(userData);
    
    res.json({ 
      success: true, 
      message: 'User created successfully',
      user: {
        id: user._id,
        role: user.role,
        fullName: user.profile.fullName,
        email: user.profile.email
      }
    });
    
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create user' 
    });
  }
};

// Show edit user form
const showEditUserForm = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.sendFile(path.join(__dirname, '../views/pages/admin/users/edit.html'));
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).send('Error fetching user');
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, password, fullName, email, phone, studentId, lecturerId } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Check if email is being changed and if it's already taken
    if (email !== user.profile.email) {
      const existingUser = await User.findOne({ 'profile.email': email });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          error: 'User with this email already exists' 
        });
      }
    }
    
    // Update user data
    user.role = role;
    if (password) user.password = password;
    user.profile.fullName = fullName;
    user.profile.email = email;
    user.profile.phone = phone;
    
    // Update role-specific IDs
    if (role === 'student') {
      user.profile.studentId = studentId;
      delete user.profile.lecturerId;
    } else if (role === 'lecturer') {
      user.profile.lecturerId = lecturerId;
      delete user.profile.studentId;
    } else {
      delete user.profile.studentId;
      delete user.profile.lecturerId;
    }
    
    await user.save();
    
    res.json({ 
      success: true, 
      message: 'User updated successfully',
      user: {
        id: user._id,
        role: user.role,
        fullName: user.profile.fullName,
        email: user.profile.email
      }
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update user' 
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    // Prevent deletion of admin users (optional safety check)
    if (user.role === 'admin') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete admin users' 
      });
    }
    
    await User.findByIdAndDelete(id);
    
    res.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete user' 
    });
  }
};

module.exports = {
  showUsers,
  getUser,
  showCreateUserForm,
  showUsersList,
  createUser,
  showEditUserForm,
  updateUser,
  deleteUser
};
