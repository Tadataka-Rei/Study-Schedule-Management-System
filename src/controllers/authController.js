const { User } = require('../models');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ 'profile.email': email });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    req.session.user = {
      id: user._id,
      role: user.role,
      email: user.profile.email,
      fullName: user.profile.fullName
    };
    
    res.json({ 
      message: 'Login successful',
      user: {
        id: user._id,
        role: user.role,
        email: user.profile.email,
        fullName: user.profile.fullName
      }
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
};

const getCurrentUser = (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json({ user: req.session.user });
};

module.exports = {
  login,
  logout,
  getCurrentUser
};
