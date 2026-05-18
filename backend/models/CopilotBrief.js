const mongoose = require('mongoose');

const copilotBriefSchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    consultationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation' },
    patientName: { type: String, default: 'Patient' },
    analysisType: { type: String, default: 'symptom_analyzer' },
    symptoms: { type: String },
    brief: {
        headline: String,
        urgency: { type: String, default: 'routine' },
        primary_concern: String,
        differential_diagnosis: [String],
        red_flags: [String],
        suggested_tests: [String],
        treatment_considerations: [String],
        drug_interaction_notes: [String],
        follow_up_plan: String,
        patient_talking_points: [String],
        confidence_note: String,
    },
    predictions: { type: Array, default: [] },
    source: { type: String, enum: ['ai', 'fallback'], default: 'ai' },
}, { timestamps: true });

module.exports = mongoose.model('CopilotBrief', copilotBriefSchema);
