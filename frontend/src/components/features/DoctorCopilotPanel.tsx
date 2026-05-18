"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, AlertTriangle, FlaskConical, Stethoscope, Clock } from 'lucide-react';
import io from 'socket.io-client';

export default function DoctorCopilotPanel() {
  const [briefs, setBriefs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) return;
    const socket = io('http://localhost:5000');
    socket.emit('join_doctor', user.id);
    socket.on('doctor_copilot_brief', (brief: any) => {
      const item = { ...brief, id: Date.now() };
      setBriefs((prev) => [item, ...prev].slice(0, 20));
      setSelected(item);
    });
    socket.on('new_patient_submission', (data: any) => {
      const item = {
        id: Date.now(),
        headline: `${data.patientName}: ${data.prediction}`,
        urgency: data.severity === 'critical' || data.severity === 'high' ? 'urgent' : 'soon',
        primary_concern: data.symptoms?.slice(0, 200),
        type: data.analysisType || 'symptom',
        patientName: data.patientName,
        timestamp: data.timestamp,
        differential_diagnosis: data.predictions?.map((p: any) => p.disease || p) || [data.prediction],
      };
      setBriefs((prev) => [item, ...prev].slice(0, 20));
    });
    socket.on('patient_analysis_complete', (data: any) => {
      const top = data.predictions?.[0];
      const item = {
        id: Date.now() + 1,
        headline: `${data.patientName || 'Patient'}: ${top?.disease || data.type?.replace(/_/g, ' ')}`,
        urgency: data.urgency_level === 'emergency' || data.severity === 'critical' ? 'emergency' : data.severity === 'high' ? 'urgent' : 'soon',
        primary_concern: data.fullResult?.clinical_summary || top?.reasoning || `${data.type} completed`,
        type: data.type || 'analysis',
        patientName: data.patientName,
        timestamp: data.timestamp,
        differential_diagnosis: (data.predictions || []).map((p: any) => p.disease).filter(Boolean),
        fullResult: data.fullResult,
      };
      setBriefs((prev) => [item, ...prev].slice(0, 20));
      setSelected(item);
    });
    return () => { socket.disconnect(); };
  }, []);

  return (
    <motion.div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
          <Brain className="w-7 h-7 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-900">AI Copilot Live Brief</h3>
          <p className="text-sm text-slate-500 font-medium">Real-time clinical summaries when patients submit symptoms or prescriptions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {briefs.length === 0 ? (
            <div className="p-10 bg-white border border-slate-200 rounded-[2rem] text-center">
              <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-4" />
              <p className="text-sm text-slate-500 font-medium">Waiting for patient submissions…</p>
            </div>
          ) : (
            briefs.map((b) => (
              <button key={b.id} type="button" onClick={() => setSelected(b)}
                className={`w-full text-left p-5 rounded-[1.5rem] border transition-all ${selected?.id === b.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-indigo-100'}`}>
                <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mb-1">{b.type || 'case'}</p>
                <p className="text-sm font-black text-slate-900 line-clamp-2">{b.headline || b.primary_concern}</p>
                <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {b.timestamp ? new Date(b.timestamp).toLocaleTimeString() : 'Just now'}
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
                  <h4 className="text-2xl font-black text-slate-900 mt-4">{selected.headline || selected.primary_concern}</h4>
                  {selected.primary_concern && selected.headline && (
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
