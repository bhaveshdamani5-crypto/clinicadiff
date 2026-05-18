"use client";
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, AlertTriangle, FlaskConical, Stethoscope, Clock, RefreshCw, Loader2, Zap } from 'lucide-react';
import io from 'socket.io-client';
import { API_BASE } from '@/lib/api';

function normalizeBrief(raw: any) {
  return {
    id: raw.id || raw._id || String(Date.now()),
    headline: raw.headline || `${raw.patientName || 'Patient'}: ${raw.analysisType || 'case'}`,
    urgency: raw.urgency || 'routine',
    primary_concern: raw.primary_concern || raw.symptoms?.slice?.(0, 300) || '',
    differential_diagnosis: raw.differential_diagnosis || (raw.predictions || []).map((p: any) => p.disease).filter(Boolean),
    red_flags: raw.red_flags || [],
    suggested_tests: raw.suggested_tests || [],
    treatment_considerations: raw.treatment_considerations || [],
    drug_interaction_notes: raw.drug_interaction_notes || [],
    follow_up_plan: raw.follow_up_plan || '',
    patient_talking_points: raw.patient_talking_points || [],
    confidence_note: raw.confidence_note || '',
    patientName: raw.patientName,
    type: raw.type || raw.analysisType,
    timestamp: raw.timestamp || raw.createdAt,
    source: raw.source,
  };
}

export default function DoctorCopilotPanel() {
  const [briefs, setBriefs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const pushBrief = useCallback((raw: any) => {
    const item = normalizeBrief(raw);
    setBriefs((prev) => {
      const filtered = prev.filter((b) => b.id !== item.id);
      return [item, ...filtered].slice(0, 50);
    });
    setSelected(item);
  }, []);

  const loadBriefs = useCallback(async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) return;
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/copilot/doctor/${user.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load briefs');
      const normalized = (Array.isArray(data) ? data : []).map(normalizeBrief);
      setBriefs(normalized);
      if (normalized.length > 0) {
        setSelected((prev: any) => prev ?? normalized[0]);
      }
    } catch (e: any) {
      setError(e.message || 'Could not load copilot briefs. Is the backend running?');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBriefs();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) return;

    const socket = io(API_BASE.replace(/\/$/, '') || 'http://localhost:5000');
    socket.emit('join_doctor', user.id);

    socket.on('doctor_copilot_brief', pushBrief);
    socket.on('new_patient_submission', () => loadBriefs());
    socket.on('patient_analysis_complete', (data: any) => {
      const top = data.predictions?.[0];
      pushBrief({
        id: `live-${Date.now()}`,
        headline: `${data.patientName || 'Patient'}: ${top?.disease || data.type}`,
        urgency: data.urgency_level === 'emergency' ? 'emergency' : data.severity === 'high' ? 'urgent' : 'soon',
        primary_concern: data.fullResult?.clinical_summary || top?.reasoning || data.type,
        type: data.type,
        patientName: data.patientName,
        timestamp: data.timestamp,
        predictions: data.predictions,
        differential_diagnosis: (data.predictions || []).map((p: any) => p.disease),
        source: 'live',
      });
    });

    return () => { socket.disconnect(); };
  }, [loadBriefs, pushBrief]);

  const generateFromQueue = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setRefreshing(true);
    try {
      const consRes = await fetch(`${API_BASE}/api/consultations/doctor/${user.id}?status=pending`);
      const consultations = await consRes.json();
      if (!consultations?.length) {
        alert('No pending consultations. Ask a patient to run an analysis with you selected as their doctor.');
        setRefreshing(false);
        return;
      }
      const latest = consultations[0];
      const res = await fetch(`${API_BASE}/api/copilot/generate/${latest._id}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Generation failed');
      pushBrief(data);
    } catch (e: any) {
      alert(e.message || 'Could not generate brief');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <motion.div className="space-y-8">
      <motion.div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <Brain className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">AI Copilot Live Brief</h3>
            <p className="text-sm text-slate-500 font-medium">Saved briefs + real-time updates when patients submit analyses</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => { setRefreshing(true); loadBriefs(); }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 bg-white text-xs font-bold uppercase tracking-widest text-slate-600 hover:border-indigo-200">
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
          <button type="button" onClick={generateFromQueue} disabled={refreshing}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50">
            <Zap className="w-4 h-4" /> Generate from Queue
          </button>
        </div>
      </motion.div>

      {error && (
        <motion.div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800 font-medium">{error}</motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {loading ? (
            <motion.div className="p-10 text-center">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
            </motion.div>
          ) : briefs.length === 0 ? (
            <motion.div className="p-10 bg-white border border-slate-200 rounded-[2rem] text-center space-y-4">
              <Stethoscope className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-500 font-medium">No briefs yet. Patients must select you as their doctor and run Symptom Analyzer, Photo+AI, or Prescription AI.</p>
              <button type="button" onClick={generateFromQueue}
                className="text-xs font-bold uppercase tracking-widest text-indigo-600 hover:underline">
                Generate from latest queue item
              </button>
            </motion.div>
          ) : (
            briefs.map((b) => (
              <button key={b.id} type="button" onClick={() => setSelected(b)}
                className={`w-full text-left p-5 rounded-[1.5rem] border transition-all ${selected?.id === b.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-100'}`}>
                <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mb-1">{b.type || 'case'}</p>
                <p className="text-sm font-black text-slate-900 line-clamp-2">{b.headline}</p>
                <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {b.timestamp ? new Date(b.timestamp).toLocaleString() : 'Just now'}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key={selected.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm space-y-8">
                <div>
                  <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                    selected.urgency === 'emergency' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'
                  }`}>{selected.urgency || 'routine'}</span>
                  {selected.source === 'fallback' && (
                    <span className="ml-2 px-3 py-1 rounded-lg text-[9px] font-bold bg-amber-50 text-amber-700">Fallback brief</span>
                  )}
                  <h4 className="text-2xl font-black text-slate-900 mt-4">{selected.headline}</h4>
                  {selected.primary_concern && (
                    <p className="text-slate-600 font-medium mt-2">{selected.primary_concern}</p>
                  )}
                </div>

                {selected.red_flags?.length > 0 && (
                  <div className="p-6 bg-red-50 border border-red-100 rounded-2xl">
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Red Flags
                    </p>
                    <ul className="space-y-2">
                      {selected.red_flags.map((f: string, i: number) => (
                        <li key={i} className="text-sm text-red-900 font-medium">• {f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selected.differential_diagnosis?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Differential Diagnosis</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.differential_diagnosis.map((d: string, i: number) => (
                        <span key={i} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">{d}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selected.suggested_tests?.length > 0 && (
                  <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <FlaskConical className="w-4 h-4" /> Suggested Tests
                    </p>
                    <ul className="space-y-1">
                      {selected.suggested_tests.map((t: string, i: number) => (
                        <li key={i} className="text-sm text-blue-900">• {t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selected.treatment_considerations?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Treatment Considerations</p>
                    <ul className="space-y-2">
                      {selected.treatment_considerations.map((t: string, i: number) => (
                        <li key={i} className="text-sm text-slate-700">• {t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selected.follow_up_plan && (
                  <p className="text-sm text-slate-600 font-medium border-t border-slate-100 pt-6">
                    <strong>Follow-up:</strong> {selected.follow_up_plan}
                  </p>
                )}

                {selected.confidence_note && (
                  <p className="text-xs text-slate-400 italic">{selected.confidence_note}</p>
                )}
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex items-center justify-center bg-slate-50 border border-slate-200 rounded-[2.5rem]">
                <p className="text-slate-400 font-medium">Select a brief from the queue</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
