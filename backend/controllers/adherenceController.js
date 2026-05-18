const Adherence = require('../models/Adherence');

exports.getSchedule = async (req, res) => {
    try {
        const { patientId } = req.params;
        let record = await Adherence.findOne({ patientId }).sort({ updatedAt: -1 });
        if (!record) {
            return res.json({ schedule: null, streak: 0, adherenceRate: 0, logs: [] });
        }
        const rate = record.totalDoses > 0
            ? Math.round((record.takenDoses / record.totalDoses) * 100)
            : 0;
        res.json({
            schedule: record.schedule,
            streak: record.streak,
            adherenceRate: rate,
            logs: record.logs,
            id: record._id,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.saveSchedule = async (req, res) => {
    try {
        const { patientId, schedule } = req.body;
        const reminders = schedule?.daily_reminders || [];
        const record = await Adherence.findOneAndUpdate(
            { patientId },
            {
                patientId,
                schedule,
                totalDoses: reminders.length,
                takenDoses: 0,
                streak: 0,
                logs: reminders.map((r) => ({
                    drug_name: r.drug_name,
                    time: r.time,
                    taken: false,
                })),
            },
            { upsert: true, new: true }
        );
        res.json({ message: 'Schedule saved', record });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markDose = async (req, res) => {
    try {
        const { patientId } = req.params;
        const { drug_name, time, taken } = req.body;
        const record = await Adherence.findOne({ patientId });
        if (!record) {
            return res.status(404).json({ message: 'No schedule found' });
        }

        const log = record.logs.find(
            (l) => l.drug_name === drug_name && l.time === time
        );
        if (log) {
            const wasTaken = log.taken;
            log.taken = taken !== false;
            log.takenAt = log.taken ? new Date() : undefined;
            if (log.taken && !wasTaken) record.takenDoses += 1;
            if (!log.taken && wasTaken) record.takenDoses = Math.max(0, record.takenDoses - 1);
        }

        const allTaken = record.logs.length > 0 && record.logs.every((l) => l.taken);
        if (allTaken) record.streak += 1;

        await record.save();
        const rate = record.totalDoses > 0
            ? Math.round((record.takenDoses / record.totalDoses) * 100)
            : 0;
        res.json({
            message: 'Dose updated',
            streak: record.streak,
            adherenceRate: rate,
            logs: record.logs,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
