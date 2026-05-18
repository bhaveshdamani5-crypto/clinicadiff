"use client";
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Users, Plus, Send, Loader2, Stethoscope, Building2 } from 'lucide-react';
import io from 'socket.io-client';
import { API_BASE } from '@/lib/api';

export default function DoctorCaseCollaboration() {
  const [cases, setCases] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [inviteIds, setInviteIds] = useState<string[]>([]);
  const [profile, setProfile] = useState({ hospital: '', bio: '', specialization: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};

  const loadCases = async () => {
    if (!user.id) return;
    const res = await fetch(`${API_BASE}/api/cases/doctor/${user.id}`);
    const data = await res.json();
    if (res.ok) setCases(data);
    setLoading(false);
  };

  const loadCase = async (id: string) => {
    const res = await fetch(`${API_BASE}/api/cases/${id}`);
    const data = await res.json();
    if (res.ok) setSelectedCase(data);
  };

  useEffect(() => {
    loadCases();
    fetch(`${API_BASE}/api/cases/doctors`).then((r) => r.json()).then(setDoctors);
    setProfile({
      hospital: user.hospital || '',
      bio: user.bio || '',
      specialization: user.specialization || '',
    });

    const socket = io(API_BASE.replace(/\/$/, '') || 'http://localhost:5000');
    socket.emit('join_doctor', user.id);
    socket.on('case_new_message', (payload: any) => {
      if (selectedCase?._id === payload.caseId) loadCase(payload.caseId);
      loadCases();
    });
    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    if (selectedCase?._id) {
      const socket = io(API_BASE.replace(/\/$/, '') || 'http://localhost:5000');
      socket.emit('join_case', selectedCase._id);
      return () => { socket.disconnect(); };
    }
  }, [selectedCase?._id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedCase?.messages]);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...profile }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('user', JSON.stringify({ ...user, ...data }));
        alert('Profile updated');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const createCase = async () => {
    if (!newTitle.trim()) return;
    const res = await fetch(`${API_BASE}/api/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle,
        summary: newSummary,
        createdBy: user.id,
        doctorId: user.id,
        participantIds: inviteIds,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setShowNew(false);
      setNewTitle('');
      setNewSummary('');
      setInviteIds([]);
      loadCases();
      setSelectedCase(data);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !selectedCase) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/cases/${selectedCase._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: user.id, doctorName: user.name, text: message }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedCase(data);
        setMessage('');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Doctor profile */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-3">
              <Stethoscope className="w-6 h-6 text-blue-600" /> My Doctor Profile
            </h3>
            <motion.div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hospital / Clinic</label>
                <input value={profile.hospital} onChange={(e) => setProfile({ ...profile, hospital: e.target.value })}
                  className="w-full mt-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm" placeholder="City General Hospital" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Specialization</label>
                <input value={profile.specialization} onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                  className="w-full mt-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bio</label>
                <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full mt-1 px-4 py-3 rounded-2xl border border-slate-200 text-sm h-24 resize-none"
                  placeholder="Brief background for colleagues…" />
              </div>
              <button type="button" onClick={saveProfile} disabled={savingProfile}
                className="w-full py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest disabled:opacity-50">
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Profile'}
              </button>
            </motion.div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm">
            <motion.div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" /> Case Threads
              </h4>
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                <Plus className="w-4 h-4" />
              </button>
            </motion.div>

            {showNew && (
              <motion.div className="mb-4 p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-100">
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Case title"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" />
                <textarea value={newSummary} onChange={(e) => setNewSummary(e.target.value)} placeholder="Case summary"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm h-20 resize-none" />
                <p className="text-[9px] font-bold text-slate-400 uppercase">Invite colleagues</p>
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {doctors.filter((d: any) => d._id !== user.id).map((d: any) => (
                    <label key={d._id} className="flex items-center gap-2 text-xs">
                      <input type="checkbox" checked={inviteIds.includes(d._id)}
                        onChange={(e) => setInviteIds(e.target.checked ? [...inviteIds, d._id] : inviteIds.filter((id) => id !== d._id))} />
                      Dr. {d.name} {d.specialization && `(${d.specialization})`}
                    </label>
                  ))}
                </div>
                <button type="button" onClick={createCase} className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">Open Case</button>
              </motion.div>
            )}

            {loading ? (
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
            ) : cases.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No case discussions yet</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cases.map((c) => (
                  <button key={c._id} type="button" onClick={() => loadCase(c._id)}
                    className={`w-full text-left p-3 rounded-xl border text-sm ${selectedCase?._id === c._id ? 'bg-indigo-50 border-indigo-200' : 'border-slate-100 hover:border-indigo-100'}`}>
                    <p className="font-bold text-slate-800 line-clamp-1">{c.title}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{c.messages?.length || 0} messages</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm flex flex-col min-h-[520px]">
          {selectedCase ? (
            <>
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-xl font-black text-slate-900">{selectedCase.title}</h3>
                {selectedCase.summary && <p className="text-sm text-slate-500 mt-2">{selectedCase.summary}</p>}
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedCase.participants?.map((p: any) => (
                    <span key={p._id} className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-xl text-[10px] font-bold text-blue-700 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Dr. {p.name}
                      {p.hospital && <span className="text-blue-400 font-normal">· {p.hospital}</span>}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedCase.messages?.length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-10">Start the multidisciplinary discussion</p>
                )}
                {selectedCase.messages?.map((m: any, i: number) => (
                  <div key={i} className={`flex ${m.doctorId === user.id || m.doctorId?._id === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl ${m.doctorId === user.id || m.doctorId?._id === user.id ? 'bg-indigo-600 text-white' : 'bg-slate-50 border border-slate-100'}`}>
                      <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 mb-1">Dr. {m.doctorName}</p>
                      <p className="text-sm font-medium">{m.text}</p>
                    </div>
                  </div>
                ))}
                <motion.div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t border-slate-100 flex gap-3">
                <input value={message} onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Discuss diagnosis, treatment, referrals…"
                  className="flex-1 px-5 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-400" />
                <button type="button" onClick={sendMessage} disabled={sending}
                  className="px-5 py-3 bg-indigo-600 text-white rounded-2xl disabled:opacity-50">
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10">
              <Building2 className="w-12 h-12 mb-4 opacity-30" />
              <p className="font-medium text-center">Select or create a case to discuss with other doctors</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
