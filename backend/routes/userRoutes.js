const express = require('express');
const router = express.Router();
const { getPatients, getDoctors } = require('../controllers/userController');

// In a real app, you'd add a middleware here to verify JWT
router.get('/patients', getPatients);
router.get('/doctors', getDoctors);

module.exports = router;
