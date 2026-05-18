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
