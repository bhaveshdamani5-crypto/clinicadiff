const mongoose = require('mongoose');

const socialOutbreakSchema = new mongoose.Schema({
    location: {
        city: { type: String, required: true },
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    symptomCluster: [{ type: String }],
    detectedCondition: { type: String },
    severity: { type: String, enum: ['low', 'moderate', 'high', 'critical'], default: 'low' },
    activeCases: { type: Number, default: 1 },
    patientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Anonymized IDs for internal tracking
    isVerified: { type: Boolean, default: false },
    alertSent: { type: Boolean, default: false }
}, { timestamps: true });

// Index for geo-spatial queries if needed later
socialOutbreakSchema.index({ "location.city": 1 });

module.exports = mongoose.model('SocialOutbreak', socialOutbreakSchema);
