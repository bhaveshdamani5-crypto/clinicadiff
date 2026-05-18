const mongoose = require('mongoose');

const doseLogSchema = new mongoose.Schema({
    drug_name: String,
    time: String,
    taken: { type: Boolean, default: false },
    takenAt: Date,
}, { _id: false });

const adherenceSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    schedule: {
        schedule_title: String,
        daily_reminders: [{
            drug_name: String,
            time: String,
            time_label: String,
            dosage: String,
            instruction: String,
            icon: String,
        }],
        weekly_tips: [String],
        missed_dose_advice: String,
        streak_message: String,
    },
    logs: [doseLogSchema],
    streak: { type: Number, default: 0 },
    totalDoses: { type: Number, default: 0 },
    takenDoses: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Adherence', adherenceSchema);
