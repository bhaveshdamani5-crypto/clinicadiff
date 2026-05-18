const express = require('express');
const router = express.Router();
const { getPatients, getDoctors, getDoctorById, updateProfile } = require('../controllers/userController');

router.get('/patients', getPatients);
router.get('/doctors', getDoctors);
router.get('/doctors/:id', getDoctorById);
router.patch('/profile', updateProfile);

module.exports = router;
