const express = require('express');
const { registerUser, loginUser, getUser, updateUser } = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/users', registerUser);
router.post('/login', loginUser);
router.get('/users/:id', authenticateToken, getUser);
router.put('/users/:id', authenticateToken, updateUser);

module.exports = router;
