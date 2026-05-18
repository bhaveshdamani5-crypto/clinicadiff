const mongoose = require('mongoose');

const medicalHistorySchema = new mongoose.Schema({
    patientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    diagnosis: { 
        type: String, 
        required: true 
    },
    treatment: { 
        type: String 
    },
    medications: [{
        name: String,
        dosage: String,
        duration: String
    }],
    labResults: [{
        testName: String,
        result: String,
        date: Date
    }],
    recordedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' // Usually a doctor
    }
}, { timestamps: true });

module.exports = mongoose.model('MedicalHistory', medicalHistorySchema);
