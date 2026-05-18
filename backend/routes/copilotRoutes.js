const express = require('express');
const router = express.Router();
const {
    getDoctorBriefs,
    generateFromConsultation,
} = require('../controllers/copilotController');

router.get('/doctor/:doctorId', getDoctorBriefs);
router.post('/generate/:consultationId', generateFromConsultation);

module.exports = router;
