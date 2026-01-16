const express = require('express');
const { logout, getCurrentUser } = require('../controllers/sessionController');

const router = express.Router();

router.post('/logout', logout);
router.get('/me', getCurrentUser);

module.exports = router;
