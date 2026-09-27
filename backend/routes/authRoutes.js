const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validationMiddleware');
const { protect } = require('../middlewares/authMiddleware');
const {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getMe,
} = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  registerUser
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required'),
  ],
  validate,
  loginUser
);

router.post('/refresh-token', refreshToken);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);

module.exports = router;
