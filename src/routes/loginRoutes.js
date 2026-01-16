const express = require('express');
const { showLoginPage, processLogin } = require('../controllers/loginController');

const router = express.Router();

router.get('/', showLoginPage);
router.post('/', processLogin);

module.exports = router;
