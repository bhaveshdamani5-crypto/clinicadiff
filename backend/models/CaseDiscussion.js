const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorName: { type: String, required: true },
    text: { type: String, required: true },
}, { timestamps: true });

const caseDiscussionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    consultationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    summary: { type: String },
    aiSuggestion: { type: String },
    messages: [messageSchema],
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, { timestamps: true });

module.exports = mongoose.model('CaseDiscussion', caseDiscussionSchema);
