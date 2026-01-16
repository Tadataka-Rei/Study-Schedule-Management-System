const { User } = require('../models');

const showLoginPage = (req, res) => {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  res.sendFile(require('path').join(__dirname, '../views/pages/login.html'));
};

const processLogin = async (req, res) => {
  console.log('🔐 Login request received:', req.body);
  
  try {
    const { email, password } = req.body;
    
    console.log('🔍 Looking for user with email:', email);
    const user = await User.findOne({ 'profile.email': email });
    
    console.log('👤 User found:', user ? 'YES' : 'NO');
    if (user) {
      console.log('🔑 Password check:', user.password === password ? 'MATCH' : 'NO MATCH');
      console.log('👔 User role:', user.role);
    }
    
    if (!user || user.password !== password) {
      console.log('❌ Login failed: Invalid credentials');
      return res.status(401).json({ 
        success: false,
        error: 'Invalid email or password' 
      });
    }
    
    console.log('✅ Creating session for user:', user.profile.email);
    req.session.user = {
      id: user._id,
      role: user.role,
      email: user.profile.email,
      fullName: user.profile.fullName
    };
    
    console.log('🎯 Login successful, sending response');
    res.json({ 
      success: true,
      message: 'Login successful',
      redirectUrl: '/dashboard',
      user: {
        id: user._id,
        role: user.role,
        email: user.profile.email,
        fullName: user.profile.fullName
      }
    });
    
  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Login failed. Please try again.' 
    });
  }
};

module.exports = {
  showLoginPage,
  processLogin
};
