const User = require('../models/User');

exports.getPatients = async (req, res) => {
    try {
        const patients = await User.find({ role: 'patient' }).select('-password');
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDoctors = async (req, res) => {
    try {
        const { specialization } = req.query;
        const query = { role: 'doctor' };
        if (specialization) query.specialization = specialization;
        
        const doctors = await User.find(query).select('-password');
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDoctorById = async (req, res) => {
    try {
        const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' }).select('-password');
        if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
        res.json(doctor);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { userId, name, specialization, hospital, bio, licenseId } = req.body;
        const updates = {};
        if (name) updates.name = name;
        if (specialization !== undefined) updates.specialization = specialization;
        if (hospital !== undefined) updates.hospital = hospital;
        if (bio !== undefined) updates.bio = bio;
        if (licenseId !== undefined) updates.licenseId = licenseId;

        const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
