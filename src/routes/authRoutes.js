const express = require('express');
const { login, logout, getCurrentUser } = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', getCurrentUser);

module.exports = router;
