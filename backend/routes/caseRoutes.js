const express = require('express');
const router = express.Router();
const {
    createCase,
    getDoctorCases,
    getCaseById,
    addMessage,
    createFromConsultation,
    getAllDoctors,
} = require('../controllers/caseController');

router.get('/doctors', getAllDoctors);
router.get('/doctor/:doctorId', getDoctorCases);
router.get('/:id', getCaseById);
router.post('/', createCase);
router.post('/from-consultation/:consultationId', createFromConsultation);
router.post('/:id/messages', addMessage);

module.exports = router;
