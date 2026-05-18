const express = require('express');
const router = express.Router();
const axios = require('axios');
const Consultation = require('./models/Consultation');
const { saveAndEmitBrief } = require('./controllers/copilotController');

const AI_BASE = 'http://127.0.0.1:5001';

/** Notify assigned doctor: save consultation + realtime socket events */
async function notifyDoctor(req, payload) {
    const {
        doctorId, patientId, patientName, type, symptoms, predictions = [],
        medications, diagnosis, visual_findings, urgency_level, fullResult,
    } = payload;

    if (!doctorId || !patientId) return;

    const top = predictions[0] || {};
    const aiSuggestion = top.disease || diagnosis || payload.summary || `${type} analysis`;
    const severity = top.severity || 'moderate';
    const priority = ['critical', 'high'].includes(severity) ? 'high' : 'normal';

    const symptomText = symptoms || diagnosis || JSON.stringify({
        type,
        topDisease: aiSuggestion,
        allPredictions: predictions.slice(0, 8).map((p) => p.disease),
        medications: medications?.slice?.(0, 5),
        visual_findings,
    }).slice(0, 1500);

    let consultationId = null;
    try {
        const consultation = await Consultation.create({
            patientId,
            doctorId,
            symptoms: symptomText,
            aiSuggestion: String(aiSuggestion).slice(0, 500),
            priority,
        });
        consultationId = consultation._id;
    } catch (e) {
        console.error('Consultation save error:', e.message);
    }

    const io = req.app.get('io');
    if (io) {
        io.to(`doctor_${doctorId}`).emit('new_patient_submission', {
            patientName: patientName || 'A Patient',
            symptoms: symptomText,
            prediction: aiSuggestion,
            severity,
            analysisType: type,
            predictions: predictions.slice(0, 10),
            timestamp: new Date().toISOString(),
        });

        io.to(`doctor_${doctorId}`).emit('patient_analysis_complete', {
            patientName,
            type,
            severity,
            urgency_level: urgency_level || 'routine',
            predictions: predictions.slice(0, 10),
            fullResult: fullResult || null,
            timestamp: new Date().toISOString(),
        });
    }

    await saveAndEmitBrief(req, {
        doctorId,
        patientId,
        patientName,
        type,
        symptoms: symptomText,
        predictions,
        medications,
        diagnosis,
        visual_findings,
        urgency_level,
        consultationId,
    });
}

router.get('/status', (req, res) => {
    res.json({ message: "Clinica-Diff Backend is Online" });
});

router.post('/analyze', async (req, res) => {
    try {
        const { symptoms, doctorId, patientName, patientId, age, duration_days } = req.body;
        const response = await axios.post(`${AI_BASE}/predict`, {
            symptoms, age, duration_days,
        });

        if (doctorId && patientId) {
            await notifyDoctor(req, {
                doctorId,
                patientId,
                patientName,
                type: 'symptom_analyzer',
                symptoms,
                predictions: response.data?.predictions || [],
                urgency_level: response.data?.urgency_level,
                fullResult: response.data,
            });
        }

        res.json(response.data);
    } catch (error) {
        console.error('AI proxy error:', error.message);
        res.status(500).json({ error: "AI Service Unavailable. Make sure Flask is running on port 5001." });
    }
});

router.post('/multimodal-diagnose', async (req, res) => {
    try {
        const { image, symptoms, age, doctorId, patientName, patientId } = req.body;
        const response = await axios.post(`${AI_BASE}/multimodal-diagnose`, {
            image, symptoms, age,
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 120000,
            maxContentLength: 50 * 1024 * 1024,
            maxBodyLength: 50 * 1024 * 1024,
        });

        if (doctorId && patientId) {
            await notifyDoctor(req, {
                doctorId,
                patientId,
                patientName,
                type: 'multimodal_diagnosis',
                symptoms,
                predictions: response.data?.predictions || [],
                visual_findings: response.data?.visual_findings,
                urgency_level: response.data?.urgency_level,
                diagnosis: response.data?.clinical_summary,
                fullResult: response.data,
            });
        }

        res.json(response.data);
    } catch (error) {
        const detail = error.response?.data?.message || error.message;
        console.error('Multimodal error:', detail);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.message || 'Multimodal diagnosis unavailable.',
        });
    }
});

router.post('/scan-medicine', async (req, res) => {
    try {
        const { image, doctorId, patientName, patientId } = req.body;
        const response = await axios.post(`${AI_BASE}/scan-medicine`, { image }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 120000,
            maxContentLength: 50 * 1024 * 1024,
            maxBodyLength: 50 * 1024 * 1024,
        });

        const data = response.data;
        if (doctorId && patientId && data.identified !== false) {
            await notifyDoctor(req, {
                doctorId,
                patientId,
                patientName,
                type: 'medicine_scanner',
                symptoms: `Medicine scan: ${data.medicine_name || 'Unknown'} — ${data.generic_name || ''}`,
                predictions: (data.likely_used_for || []).map((d, i) => ({
                    disease: d,
                    confidence: 0.7 - i * 0.05,
                    severity: 'moderate',
                })),
                diagnosis: data.layman_guide?.what_is_this_medicine,
                fullResult: data,
            });
        }

        res.json(data);
    } catch (error) {
        const detail = error.response?.data?.message || error.message;
        console.error('Medicine scan error:', detail);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.message || 'Medicine scanner unavailable.',
        });
    }
});

router.post('/doctor-copilot-brief', async (req, res) => {
    try {
        const response = await axios.post(`${AI_BASE}/doctor-copilot-brief`, req.body, {
            timeout: 60000,
        });
        res.json(response.data);
    } catch (error) {
        console.error('Copilot brief error:', error.message);
        res.status(500).json({ error: 'Copilot brief unavailable.' });
    }
});

router.post('/adherence/generate-schedule', async (req, res) => {
    try {
        const { medications, doctorId, patientName, patientId } = req.body;
        const response = await axios.post(`${AI_BASE}/adherence/generate-schedule`, {
            medications,
        }, { timeout: 60000 });

        if (doctorId && patientId) {
            await notifyDoctor(req, {
                doctorId,
                patientId,
                patientName,
                type: 'adherence_coach',
                symptoms: `Adherence schedule generated for ${medications?.length || 0} medication(s)`,
                predictions: [],
                medications,
                fullResult: response.data,
            });
        }

        res.json(response.data);
    } catch (error) {
        console.error('Adherence schedule error:', error.message);
        res.status(500).json({ error: 'Adherence schedule generation failed.' });
    }
});

router.post('/ocr', async (req, res) => {
    try {
        if (req.body && req.body.image) {
            const { doctorId, patientName, patientId } = req.body;
            const response = await axios.post(`${AI_BASE}/ocr`, {
                image: req.body.image,
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 120000,
                maxContentLength: 50 * 1024 * 1024,
                maxBodyLength: 50 * 1024 * 1024,
            });

            const data = response.data;
            if (doctorId && patientId) {
                const preds = data.disease_inference?.primary_disease
                    ? [{
                        disease: data.disease_inference.primary_disease,
                        confidence: 0.85,
                        severity: data.disease_inference.severity || 'moderate',
                    }]
                    : [];
                await notifyDoctor(req, {
                    doctorId,
                    patientId,
                    patientName,
                    type: 'prescription_ai',
                    symptoms: data.diagnosis || 'Prescription uploaded',
                    predictions: preds,
                    medications: data.medications,
                    diagnosis: data.diagnosis,
                    urgency_level: data.disease_inference?.urgency,
                    fullResult: data,
                });
            }

            return res.json(data);
        }
        return res.status(400).json({ error: "No image data provided" });
    } catch (error) {
        const detail = error.response?.data?.message || error.message;
        console.error('Prescription AI proxy error:', detail);
        res.status(error.response?.status || 500).json({
            error: error.response?.data?.message || "Prescription AI unavailable. Start Flask on port 5001 (ai-model/app.py).",
        });
    }
});

router.post('/infer-disease-from-prescription', async (req, res) => {
    try {
        const { drugs_found, medications, diagnosis, doctorId, patientName, patientId } = req.body;
        const response = await axios.post(`${AI_BASE}/infer-disease-from-prescription`, {
            drugs_found, medications, diagnosis,
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000,
        });

        const inferredData = response.data;
        const io = req.app.get('io');
        if (io) {
            const notificationPayload = {
                type: 'prescription_disease_alert',
                patientName: patientName || 'A Patient',
                primary_disease: inferredData.primary_disease,
                severity: inferredData.severity,
                urgency: inferredData.urgency,
                doctor_alert: inferredData.doctor_alert,
                timestamp: new Date().toISOString(),
            };
            if (doctorId) {
                io.to(`doctor_${doctorId}`).emit('prescription_disease_alert', notificationPayload);
            }
            if (patientId) {
                io.to(`patient_${patientId}`).emit('prescription_disease_alert', {
                    ...notificationPayload,
                    patient_explanation: inferredData.patient_explanation,
                    what_this_means: inferredData.what_this_means,
                });
            }
        }

        if (doctorId && patientId) {
            await notifyDoctor(req, {
                doctorId,
                patientId,
                patientName,
                type: 'prescription_inference',
                symptoms: diagnosis || drugs_found?.join(', '),
                predictions: [{
                    disease: inferredData.primary_disease,
                    confidence: 0.8,
                    severity: inferredData.severity,
                }],
                medications,
                diagnosis,
                urgency_level: inferredData.urgency,
                fullResult: inferredData,
            });
        }

        res.json(inferredData);
    } catch (error) {
        console.error('Disease inference error:', error.message);
        res.status(500).json({ error: "Disease inference service unavailable." });
    }
});

router.post('/check-interaction', async (req, res) => {
    try {
        const { new_drugs, existing_meds } = req.body;
        const response = await axios.post(`${AI_BASE}/check-interaction`, {
            new_drugs, existing_meds,
        });
        res.json(response.data);
    } catch (error) {
        console.error('DDI check error:', error.message);
        res.status(500).json({ error: "Interaction service unavailable" });
    }
});

router.post('/calculate-hereditary-risk', async (req, res) => {
    try {
        const { family_members, drugs_found, inferred_diseases } = req.body;
        const response = await axios.post(`${AI_BASE}/calculate-hereditary-risk`, {
            family_members, drugs_found, inferred_diseases,
        });
        res.json(response.data);
    } catch (error) {
        console.error('Hereditary risk error:', error.message);
        res.status(500).json({ error: "Risk calculation service unavailable" });
    }
});

router.post('/detect-outbreaks', async (req, res) => {
    try {
        const { city, symptoms } = req.body;
        const response = await axios.post(`${AI_BASE}/detect-outbreaks`, { city, symptoms });
        res.json(response.data);
    } catch (error) {
        console.error('Outbreak detection error:', error.message);
        res.status(500).json({ error: "Outbreak service unavailable" });
    }
});

module.exports = router;
