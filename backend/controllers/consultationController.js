const Consultation = require('../models/Consultation');

exports.createConsultation = async (req, res) => {
    try {
        const { patientId, doctorId, symptoms, priority } = req.body;
        const consultation = new Consultation({ 
            patientId, 
            doctorId, 
            symptoms,
            status: 'pending',
            priority: priority || 'normal'
        });
        await consultation.save();
        res.status(201).json({ message: "Consultation submitted", consultation });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDoctorConsultations = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { status, priority, search } = req.query;
        
        let query = { doctorId };
        if (status) query.status = status;
        if (priority) query.priority = priority;

        let consultations = await Consultation.find(query).populate('patientId', 'name email');
        
        if (search) {
            const searchLower = search.toLowerCase();
            consultations = consultations.filter(c => 
                c.patientId?.name?.toLowerCase().includes(searchLower) || 
                c.patientId?.email?.toLowerCase().includes(searchLower)
            );
        }

        res.json(consultations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, doctorNotes } = req.body;
        const consultation = await Consultation.findByIdAndUpdate(
            id, 
            { 
                status, 
                doctorNotes, 
                reviewedAt: status === 'reviewed' ? Date.now() : undefined 
            }, 
            { new: true }
        );
        res.json({ message: "Status updated", consultation });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
