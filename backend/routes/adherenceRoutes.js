const express = require('express');
const router = express.Router();
const adherenceController = require('../controllers/adherenceController');

router.get('/:patientId', adherenceController.getSchedule);
router.post('/', adherenceController.saveSchedule);
router.patch('/:patientId/dose', adherenceController.markDose);

module.exports = router;
