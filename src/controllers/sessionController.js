const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ 
        success: false,
        error: 'Logout failed' 
      });
    }
    res.json({ 
      success: true,
      message: 'Logout successful',
      redirectUrl: '/login'
    });
  });
};

const getCurrentUser = (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ 
      success: false,
      error: 'Not authenticated' 
    });
  }
  
  res.json({ 
    success: true,
    user: req.session.user 
  });
};

const checkAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ 
      success: false,
      error: 'Authentication required' 
    });
  }
  next();
};

module.exports = {
  logout,
  getCurrentUser,
  checkAuth
};
