const Appointment = require('../models/Appointment');

exports.createAppointment = async (req, res) => {
    try {
        const { patientId, doctorId, appointmentDate, timeSlot, reason, notes } = req.body;

        if (!patientId || !doctorId || !appointmentDate || !timeSlot || !reason) {
            return res.status(400).json({ message: 'patientId, doctorId, appointmentDate, timeSlot, and reason are required' });
        }

        const doc = await Appointment.create({
            patientId,
            doctorId,
            appointmentDate: new Date(appointmentDate),
            timeSlot,
            reason,
            notes,
            status: 'pending',
        });

        const populated = await Appointment.findById(doc._id)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name specialization hospital');

        const io = req.app.get('io');
        if (io) {
            io.to(`doctor_${doctorId}`).emit('new_appointment_request', populated);
            io.to(`patient_${patientId}`).emit('appointment_created', populated);
        }

        res.status(201).json(populated);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

exports.getPatientAppointments = async (req, res) => {
    try {
        const list = await Appointment.find({ patientId: req.params.patientId })
            .sort({ appointmentDate: 1 })
            .populate('doctorId', 'name specialization hospital');
        res.json(list);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

exports.getDoctorAppointments = async (req, res) => {
    try {
        const list = await Appointment.find({ doctorId: req.params.doctorId })
            .sort({ appointmentDate: 1 })
            .populate('patientId', 'name email');
        res.json(list);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const doc = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        )
            .populate('patientId', 'name email')
            .populate('doctorId', 'name specialization');

        if (!doc) return res.status(404).json({ message: 'Appointment not found' });

        const io = req.app.get('io');
        if (io) {
            io.to(`patient_${doc.patientId._id || doc.patientId}`).emit('appointment_status_updated', doc);
            io.to(`doctor_${doc.doctorId._id || doc.doctorId}`).emit('appointment_status_updated', doc);
        }

        res.json(doc);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};
