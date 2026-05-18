const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
    patientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    doctorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },
    symptoms: { 
        type: String, 
        required: true 
    },
    aiSuggestion: { 
        type: String 
    },
    doctorNotes: { 
        type: String 
    },
    status: { 
        type: String, 
        enum: ['pending', 'reviewed', 'completed'], 
        default: 'pending' 
    },
    priority: {
        type: String,
        enum: ['normal', 'high'],
        default: 'normal'
    },
    reviewedAt: { 
        type: Date 
    }
}, { timestamps: true });

module.exports = mongoose.model('Consultation', consultationSchema);
