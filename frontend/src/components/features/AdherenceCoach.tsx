"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle2, Loader2, Flame, Pill } from 'lucide-react';
import { API_BASE, apiPost, getStoredUser } from '@/lib/api';

export default function AdherenceCoach({ medications, selectedDoctor }: { medications?: any[]; selectedDoctor?: string }) {
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [rate, setRate] = useState(0);

  const patientId = getStoredUser().id;

  const loadSaved = async () => {
    if (!patientId) return;
    try {
      const res = await fetch(`${API_BASE}/api/adherence/${patientId}`);
      const data = await res.json();
      if (data.schedule) {
        setSchedule(data.schedule);
        setLogs(data.logs || []);
        setStreak(data.streak || 0);
        setRate(data.adherenceRate || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { loadSaved(); }, [patientId]);

  const generate = async () => {
    const meds = medications?.length ? medications : [];
    if (!meds.length) {
      alert('Upload a prescription first, or add medicines from Prescription AI tab.');
      return;
    }
    setLoading(true);
    try {
      const user = getStoredUser();
      const { data, ok } = await apiPost<any>('/api/ai/adherence/generate-schedule', {
        medications: meds,
        doctorId: selectedDoctor,
        patientId: user.id,
        patientName: user.name,
      });
      if (!ok) {
        alert((data as any).error || 'Failed to generate schedule');
        return;
      }
      const fullSchedule = { ...data };
      setSchedule(fullSchedule);
      if (patientId) {
        await fetch(`${API_BASE}/api/adherence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId, schedule: fullSchedule }),
        });
        await loadSaved();
      } else {
        setLogs((data.daily_reminders || []).map((r: any) => ({ ...r, taken: false })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleDose = async (drug_name: string, time: string, taken: boolean) => {
    if (patientId) {
      const res = await fetch(`${API_BASE}/api/adherence/${patientId}/dose`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drug_name, time, taken }),
      });
      const data = await res.json();
      setLogs(data.logs || []);
      setStreak(data.streak || 0);
      setRate(data.adherenceRate || 0);
    } else {
      setLogs((prev) => prev.map((l) =>
        l.drug_name === drug_name && l.time === time ? { ...l, taken } : l
      ));
    }
  };

  const reminders = schedule?.daily_reminders || [];

  return (
    <motion.div className="space-y-8">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-8 rounded-[2.5rem]">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white border border-amber-100 flex items-center justify-center shadow-sm">
            <Bell className="w-7 h-7 text-amber-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Medication Adherence Coach</h3>
            <p className="text-sm text-slate-500 font-medium">AI-built daily schedule from your prescription</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-white rounded-2xl border border-amber-100 text-center">
            <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-black text-slate-900">{streak}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Day Streak</p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-amber-100 text-center">
            <p className="text-2xl font-black text-emerald-600">{rate}%</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Adherence</p>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-amber-100 text-center">
            <Pill className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-2xl font-black text-slate-900">{reminders.length}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase">Daily Doses</p>
          </div>
        </div>
        <button type="button" onClick={generate} disabled={loading}
          className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black uppercase tracking-widest text-xs rounded-[2rem] disabled:opacity-50 flex items-center justify-center gap-3">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5" />}
          {schedule ? 'Regenerate Schedule' : 'Generate My Schedule'}
        </button>
      </div>

      {schedule?.streak_message && (
        <p className="text-sm text-amber-800 font-medium text-center px-4">{schedule.streak_message}</p>
      )}

      {reminders.length > 0 && (
        <div className="space-y-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Today&apos;s Doses</p>
          {reminders.map((r: any, i: number) => {
            const log = logs.find((l) => l.drug_name === r.drug_name && l.time === r.time);
            const taken = log?.taken ?? false;
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`p-6 rounded-[2rem] border flex items-center gap-4 transition-all ${taken ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                <button type="button" onClick={() => toggleDose(r.drug_name, r.time, !taken)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all ${taken ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-slate-300 hover:border-emerald-400'}`}>
                  {taken ? <CheckCircle2 className="w-6 h-6" /> : <span className="text-lg font-black">{i + 1}</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900">{r.drug_name} <span className="text-slate-400 font-medium">{r.dosage}</span></p>
                  <p className="text-sm text-amber-600 font-bold mt-0.5">{r.time_label || r.time}</p>
                  <p className="text-xs text-slate-500 mt-1">{r.instruction}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {schedule?.weekly_tips?.length > 0 && (
        <div className="p-6 bg-white border border-slate-200 rounded-[2rem]">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Weekly Tips</p>
          <ul className="space-y-2">
            {schedule.weekly_tips.map((t: string, i: number) => (
              <li key={i} className="text-sm text-slate-600 font-medium">• {t}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
