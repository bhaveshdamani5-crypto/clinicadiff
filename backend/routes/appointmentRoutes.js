const express = require('express');
const router = express.Router();
const {
    createAppointment,
    getPatientAppointments,
    getDoctorAppointments,
    updateAppointmentStatus,
} = require('../controllers/appointmentController');

router.post('/', createAppointment);
router.get('/patient/:patientId', getPatientAppointments);
router.get('/doctor/:doctorId', getDoctorAppointments);
router.patch('/:id/status', updateAppointmentStatus);

module.exports = router;
