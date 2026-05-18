const mongoose = require('mongoose');

const familyLinkSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    familyMembers: [{
        name: { type: String, required: true },
        relation: { 
            type: String, 
            enum: ['father', 'mother', 'sibling', 'grandparent_paternal', 'grandparent_maternal', 'uncle', 'aunt'],
            required: true 
        },
        conditions: [{ type: String }], // e.g. ['Diabetes', 'Hypertension']
        ageOfOnset: { type: Number }, // age when condition was first diagnosed
        isAlive: { type: Boolean, default: true },
        causeOfDeath: { type: String }
    }],
    riskProfile: {
        overallRisk: { type: String, enum: ['low', 'moderate', 'high', 'critical'], default: 'low' },
        conditions: [{
            condition: String,
            riskPercentage: Number,
            inheritancePattern: String, // 'autosomal dominant', 'multifactorial', etc.
            preventionTips: [String],
            affectedRelatives: [String]
        }],
        lastCalculated: { type: Date, default: Date.now }
    }
}, { timestamps: true });

module.exports = mongoose.model('FamilyLink', familyLinkSchema);
