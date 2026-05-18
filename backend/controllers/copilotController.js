const axios = require('axios');
const CopilotBrief = require('../models/CopilotBrief');
const Consultation = require('../models/Consultation');

const AI_BASE = 'http://127.0.0.1:5001';

function buildFallbackBrief(payload) {
    const top = (payload.predictions || [])[0] || {};
    return {
        headline: `${payload.patientName || 'Patient'}: ${top.disease || payload.analysisType || 'Clinical case'}`,
        urgency: payload.urgency_level || (top.severity === 'high' ? 'urgent' : 'soon'),
        primary_concern: (payload.symptoms || '').slice(0, 500) || top.reasoning || 'Patient submission received',
        differential_diagnosis: (payload.predictions || []).slice(0, 6).map((p) => p.disease).filter(Boolean),
        red_flags: top.watch_out_for || [],
        suggested_tests: [],
        treatment_considerations: top.immediate_action ? [top.immediate_action] : [],
        drug_interaction_notes: [],
        follow_up_plan: 'Review full patient chart and confirm diagnosis with examination.',
        patient_talking_points: [],
        confidence_note: 'AI brief unavailable — showing structured fallback from patient data.',
    };
}

async function generateBriefFromPayload(payload) {
    try {
        const res = await axios.post(`${AI_BASE}/doctor-copilot-brief`, {
            patientName: payload.patientName,
            type: payload.analysisType,
            symptoms: payload.symptoms,
            predictions: payload.predictions,
            medications: payload.medications,
            diagnosis: payload.diagnosis,
            visual_findings: payload.visual_findings,
            urgency_level: payload.urgency_level,
        }, { timeout: 60000 });
        const data = res.data || {};
        const brief = {
            headline: data.headline,
            urgency: data.urgency,
            primary_concern: data.primary_concern,
            differential_diagnosis: data.differential_diagnosis,
            red_flags: data.red_flags,
            suggested_tests: data.suggested_tests,
            treatment_considerations: data.treatment_considerations,
            drug_interaction_notes: data.drug_interaction_notes,
            follow_up_plan: data.follow_up_plan,
            patient_talking_points: data.patient_talking_points,
            confidence_note: data.confidence_note,
        };
        return { brief, source: 'ai' };
    } catch (e) {
        console.error('Groq copilot error:', e.message);
        return { brief: buildFallbackBrief(payload), source: 'fallback' };
    }
}

exports.saveAndEmitBrief = async (req, payload) => {
    const { doctorId, patientId, patientName, type, symptoms, predictions = [],
        medications, diagnosis, visual_findings, urgency_level, consultationId } = payload;

    if (!doctorId) return null;

    const { brief, source } = await generateBriefFromPayload({
        patientName,
        analysisType: type,
        symptoms,
        predictions,
        medications,
        diagnosis,
        visual_findings,
        urgency_level,
    });

    const doc = await CopilotBrief.create({
        doctorId,
        patientId,
        consultationId,
        patientName: patientName || 'Patient',
        analysisType: type || 'symptom_analyzer',
        symptoms,
        brief: {
            headline: brief.headline,
            urgency: brief.urgency,
            primary_concern: brief.primary_concern,
            differential_diagnosis: brief.differential_diagnosis || [],
            red_flags: brief.red_flags || [],
            suggested_tests: brief.suggested_tests || [],
            treatment_considerations: brief.treatment_considerations || [],
            drug_interaction_notes: brief.drug_interaction_notes || [],
            follow_up_plan: brief.follow_up_plan,
            patient_talking_points: brief.patient_talking_points || [],
            confidence_note: brief.confidence_note,
        },
        predictions,
        source,
    });

    const io = req.app.get('io');
    const item = {
        id: doc._id.toString(),
        ...doc.brief,
        patientName: doc.patientName,
        patientId: doc.patientId,
        type: doc.analysisType,
        analysisType: doc.analysisType,
        timestamp: doc.createdAt,
        source,
    };

    if (io) {
        io.to(`doctor_${doctorId}`).emit('doctor_copilot_brief', item);
    }

    return doc;
};

exports.getDoctorBriefs = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const briefs = await CopilotBrief.find({ doctorId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        res.json(briefs.map((b) => ({
            id: b._id.toString(),
            ...b.brief,
            patientName: b.patientName,
            patientId: b.patientId,
            type: b.analysisType,
            analysisType: b.analysisType,
            symptoms: b.symptoms,
            predictions: b.predictions,
            timestamp: b.createdAt,
            source: b.source,
        })));
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

exports.generateFromConsultation = async (req, res) => {
    try {
        const consultation = await Consultation.findById(req.params.consultationId)
            .populate('patientId', 'name')
            .populate('doctorId', 'name');

        if (!consultation) return res.status(404).json({ message: 'Consultation not found' });

        const doc = await exports.saveAndEmitBrief(req, {
            doctorId: consultation.doctorId?._id || consultation.doctorId,
            patientId: consultation.patientId?._id || consultation.patientId,
            patientName: consultation.patientId?.name || 'Patient',
            type: 'consultation_review',
            symptoms: consultation.symptoms,
            predictions: consultation.aiSuggestion
                ? [{ disease: consultation.aiSuggestion, confidence: 0.8, severity: consultation.priority === 'high' ? 'high' : 'moderate' }]
                : [],
            consultationId: consultation._id,
            urgency_level: consultation.priority === 'high' ? 'urgent' : 'routine',
        });

        res.json({
            id: doc._id.toString(),
            ...doc.brief,
            patientName: doc.patientName,
            type: doc.analysisType,
            timestamp: doc.createdAt,
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};
