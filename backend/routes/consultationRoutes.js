const express = require('express');
const router = express.Router();
const { 
    createConsultation, 
    getDoctorConsultations, 
    updateStatus 
} = require('../controllers/consultationController');

router.post('/', createConsultation);
router.get('/doctor/:doctorId', getDoctorConsultations);
router.patch('/:id/status', updateStatus);

module.exports = router;
