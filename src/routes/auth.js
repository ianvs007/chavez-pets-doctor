const express = require('express');
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.post('/login', ctrl.login);
router.post('/logout', authenticate, ctrl.logout);
router.get('/profile', authenticate, ctrl.profile);

module.exports = router;
