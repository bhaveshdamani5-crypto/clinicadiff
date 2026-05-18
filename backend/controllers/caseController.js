const CaseDiscussion = require('../models/CaseDiscussion');
const Consultation = require('../models/Consultation');
const User = require('../models/User');

exports.createCase = async (req, res) => {
    try {
        const { title, patientId, consultationId, participantIds, summary, aiSuggestion } = req.body;
        const createdBy = req.body.createdBy || req.body.doctorId;

        if (!createdBy || !title) {
            return res.status(400).json({ message: 'title and createdBy (doctorId) required' });
        }

        const participants = new Set([createdBy, ...(participantIds || [])].map(String));

        const doc = await CaseDiscussion.create({
            title,
            patientId,
            consultationId,
            createdBy,
            participants: [...participants],
            summary,
            aiSuggestion,
            messages: [],
        });

        const populated = await CaseDiscussion.findById(doc._id)
            .populate('patientId', 'name')
            .populate('participants', 'name specialization hospital')
            .populate('createdBy', 'name specialization');

        const io = req.app.get('io');
        if (io) {
            populated.participants.forEach((p) => {
                io.to(`doctor_${p._id}`).emit('case_discussion_updated', { caseId: doc._id });
            });
        }

        res.status(201).json(populated);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

exports.getDoctorCases = async (req, res) => {
    try {
        const { doctorId } = req.params;
        // Global forum: fetch ALL cases so any doctor can jump in and discuss
        const cases = await CaseDiscussion.find({})
            .sort({ updatedAt: -1 })
            .populate('patientId', 'name')
            .populate('participants', 'name specialization hospital')
            .populate('createdBy', 'name specialization')
            .limit(100);
        res.json(cases);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

exports.getCaseById = async (req, res) => {
    try {
        const doc = await CaseDiscussion.findById(req.params.id)
            .populate('patientId', 'name')
            .populate('participants', 'name specialization hospital bio')
            .populate('createdBy', 'name specialization')
            .populate('messages.doctorId', 'name specialization');
        if (!doc) return res.status(404).json({ message: 'Case not found' });
        res.json(doc);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

exports.addMessage = async (req, res) => {
    try {
        const { doctorId, doctorName, text } = req.body;
        if (!text?.trim()) return res.status(400).json({ message: 'Message text required' });

        const doc = await CaseDiscussion.findByIdAndUpdate(
            req.params.id,
            {
                $push: {
                    messages: {
                        doctorId,
                        doctorName: doctorName || 'Doctor',
                        text: text.trim(),
                    },
                },
            },
            { new: true }
        )
            .populate('patientId', 'name')
            .populate('participants', 'name specialization hospital');

        if (!doc) return res.status(404).json({ message: 'Case not found' });

        const io = req.app.get('io');
        if (io) {
            // Global emit so all doctors see the live chat updates
            io.emit('case_new_message', {
                caseId: doc._id,
                message: doc.messages[doc.messages.length - 1],
            });
        }

        res.json(doc);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

exports.createFromConsultation = async (req, res) => {
    try {
        const consultation = await Consultation.findById(req.params.consultationId)
            .populate('patientId', 'name')
            .populate('doctorId', 'name specialization');

        if (!consultation) return res.status(404).json({ message: 'Consultation not found' });

        const doctorId = req.body.doctorId || consultation.doctorId?._id;
        const title = req.body.title || `Case: ${consultation.patientId?.name || 'Patient'} — ${consultation.aiSuggestion || 'Review'}`;

        const doc = await CaseDiscussion.create({
            title,
            patientId: consultation.patientId?._id || consultation.patientId,
            consultationId: consultation._id,
            createdBy: doctorId,
            participants: [doctorId, ...(req.body.participantIds || [])],
            summary: consultation.symptoms,
            aiSuggestion: consultation.aiSuggestion,
        });

        const populated = await CaseDiscussion.findById(doc._id)
            .populate('patientId', 'name')
            .populate('participants', 'name specialization hospital')
            .populate('createdBy', 'name specialization');

        res.status(201).json(populated);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

exports.getAllDoctors = async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor' }).select('-password').sort({ name: 1 });
        res.json(doctors);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};
