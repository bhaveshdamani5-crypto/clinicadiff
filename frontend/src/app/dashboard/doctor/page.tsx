"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  ChevronRight, 
  Activity,
  Calendar,
  Brain,
  Zap,
  Target,
  Waves,
  ShieldCheck,
  TrendingUp,
  Radio,
  Loader2,
  Mic,
  MicOff,
  X
} from 'lucide-react';
import io from 'socket.io-client';
import { API_BASE } from '@/lib/api';
import DoctorCopilotPanel from '@/components/features/DoctorCopilotPanel';
import DoctorCaseCollaboration from '@/components/features/DoctorCaseCollaboration';

export default function DoctorDashboard() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ pending: 0, reviewed: 0, completed: 0, highRisk: 0 });
  const [activeTab, setActiveTab] = useState<'queue' | 'copilot' | 'collaboration' | 'appointments' | 'analyzer' | 'analytics' | 'records'>('copilot');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  
  // Symptom Analyzer State (Doctor Side)
  const [analyzerSymptoms, setAnalyzerSymptoms] = useState('');
  const [analyzerLoading, setAnalyzerLoading] = useState(false);
  const [analyzerResult, setAnalyzerResult] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const fetchAppointments = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/appointments/doctor/${user.id}`);
      const data = await res.json();
      if (res.ok) setAppointments(data);
    } catch (e) { console.error(e); }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    await fetch(`${API_BASE}/api/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchAppointments();
  };

  const openCaseDiscussion = async (consultationId: string) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const res = await fetch(`${API_BASE}/api/cases/from-consultation/${consultationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId: user.id }),
    });
    if (res.ok) {
      setActiveTab('collaboration');
    } else {
      alert('Could not open case discussion');
    }
  };

  useEffect(() => {
    fetchConsultations();
    fetchAppointments();
    
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};
    const socket = io(API_BASE);
    if (user.id) {
      socket.emit('join_doctor', user.id);
      socket.on('new_patient_submission', () => {
        fetchConsultations();
      });
      socket.on('new_appointment_request', (data) => {
        fetchAppointments();
        setNotification(`New appointment request from ${data?.patientId?.name || 'a patient'}`);
        setTimeout(() => setNotification(null), 5000);
      });
    }
    return () => { socket.disconnect(); };
  }, [filter, priorityFilter, search]);

  const fetchConsultations = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      if (!user.id) return;

      const params = new URLSearchParams();
      if (filter) params.append('status', filter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (search) params.append('search', search);

      const res = await fetch(`${API_BASE}/api/consultations/doctor/${user.id}?${params.toString()}`);
      const data = await res.json();
      setConsultations(data);
      
      const allRes = await fetch(`${API_BASE}/api/consultations/doctor/${user.id}`);
      const allData = await allRes.json();
      setStats({
        pending: allData.filter((c: any) => c.status === 'pending').length,
        reviewed: allData.filter((c: any) => c.status === 'reviewed').length,
        completed: allData.filter((c: any) => c.status === 'completed').length,
        highRisk: allData.filter((c: any) => c.priority === 'high').length
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API_BASE}/api/consultations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchConsultations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzerLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: analyzerSymptoms })
      });
      const data = await res.json();
      setAnalyzerResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzerLoading(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setAnalyzerSymptoms(prev => prev + finalTranscript);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (e: any) => {
      console.error('Speech recognition error:', e.error, e.message);
      if (e.error === 'not-allowed') {
        alert("Microphone access was denied. Please allow microphone access in your browser settings to use voice dictation.");
      } else if (e.error === 'no-speech') {
        // Just ignore if no speech was detected immediately
      } else {
        alert("Voice recognition error: " + e.error + ". Make sure you are using Chrome/Edge and have a working microphone.");
      }
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  return (
    <DashboardLayout>
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[100] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700"
          >
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Incoming Notification</p>
              <p className="text-sm font-medium">{notification}</p>
            </div>
            <button onClick={() => setNotification(null)} className="ml-4 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="space-y-10 pb-20 max-w-7xl mx-auto relative">
        {/* Ambient Glows */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-cyan-400/5 blur-[100px] rounded-full pointer-events-none" />

        {/* Cinematic Navigation Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-4"
            >
              <Radio className="w-4 h-4 text-blue-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-500">Neural Uplink Active</span>
            </motion.div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Command <span className="text-blue-600 font-light">Center</span>
            </h1>
          </div>

          <div className="bg-white/80 backdrop-blur-xl p-2 rounded-3xl border border-slate-200/60 flex gap-1 shadow-lg shadow-blue-500/5">
            {[
              { id: 'copilot', label: 'AI Copilot', icon: Brain },
              { id: 'queue', label: 'Patient Queue', icon: Users },
              { id: 'collaboration', label: 'Case Board', icon: Users },
              { id: 'appointments', label: 'Appointments', icon: Calendar },
              { id: 'analyzer', label: 'Symptom Analyzer', icon: Brain },
              { id: 'analytics', label: 'Neural Analytics', icon: Activity },
              { id: 'records', label: 'Bio Records', icon: Zap },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all duration-300 relative overflow-hidden group ${
                  activeTab === tab.id 
                    ? 'bg-blue-50 text-blue-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <tab.icon className={`w-4 h-4 transition-colors ${activeTab === tab.id ? 'text-blue-600' : 'group-hover:text-blue-500'}`} />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'copilot' && (
            <motion.div key="copilot" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <DoctorCopilotPanel />
            </motion.div>
          )}

          {activeTab === 'collaboration' && (
            <motion.div key="collab" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <DoctorCaseCollaboration />
            </motion.div>
          )}

          {activeTab === 'appointments' && (
            <motion.div key="appts" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <h2 className="text-2xl font-black text-slate-900">Patient Appointments</h2>
              {appointments.length === 0 ? (
                <p className="text-slate-500 p-10 bg-white border border-slate-200 rounded-[2rem] text-center">No appointment requests yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {appointments.map((a) => (
                    <div key={a._id} className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
                      <p className="font-black text-slate-900">{a.patientId?.name || 'Patient'}</p>
                      <p className="text-sm text-slate-500 mt-1">{new Date(a.appointmentDate).toLocaleDateString()} · {a.timeSlot}</p>
                      <p className="text-sm text-slate-700 mt-3">{a.reason}</p>
                      <span className="inline-block mt-3 px-3 py-1 rounded-xl text-[9px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-100">{a.status}</span>
                      {a.status === 'pending' && (
                        <motion.div className="flex gap-2 mt-4">
                          <button type="button" onClick={() => updateAppointmentStatus(a._id, 'confirmed')}
                            className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">Confirm</button>
                          <button type="button" onClick={() => updateAppointmentStatus(a._id, 'cancelled')}
                            className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">Decline</button>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'queue' && (
            <motion.div
              key="queue-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
                  { label: 'Critical Priority', value: stats.highRisk, icon: AlertCircle, color: 'bg-red-50', text: 'text-red-500', border: 'border-red-100' },
                  { label: 'Evaluated', value: stats.reviewed, icon: ShieldCheck, color: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
                  { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'bg-emerald-50', text: 'text-emerald-500', border: 'border-emerald-100' },
                ].map((stat, i) => (
                  <motion.div 
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={`bg-white/80 backdrop-blur-md p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-slate-300 transition-all`}
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-700 text-slate-900">
                      <stat.icon className="w-24 h-24 rotate-12" />
                    </div>
                    <div className="flex justify-between items-start relative z-10">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
                      <div className={`p-3 rounded-2xl border ${stat.color} ${stat.text} ${stat.border}`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-5xl font-black text-slate-900 mt-6 tracking-tighter">{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Filters & Control */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-4 bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="bg-slate-50/50 p-1.5 rounded-[2rem] border border-slate-200 flex gap-1">
                    {['pending', 'reviewed', 'completed'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
                          filter === s 
                            ? 'bg-white text-blue-600 shadow-md shadow-slate-200 border border-slate-200/50' 
                            : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  
                  <div className="relative group">
                    <select 
                      className="bg-white/80 border border-slate-200 shadow-sm rounded-[1.5rem] px-6 py-3.5 text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 appearance-none cursor-pointer pr-12 transition-all hover:bg-white"
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      value={priorityFilter}
                    >
                      <option value="">All Priorities</option>
                      <option value="normal">Standard</option>
                      <option value="high">Urgent</option>
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" />
                  </div>
                </div>

                <div className="relative group min-w-[300px]">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search bio-records..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/80 border border-slate-200 shadow-sm rounded-[1.5rem] pl-12 pr-6 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Consultation Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {loading ? (
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className="h-72 bg-white/60 border border-slate-200 rounded-[2.5rem] animate-pulse" />
                  ))
                ) : (
                  consultations.map((c) => (
                    <motion.div 
                      key={c._id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 rounded-[2.5rem] overflow-hidden flex flex-col justify-between group transition-all duration-300"
                    >
                      <div className="p-8">
                        <div className="flex items-start justify-between mb-8">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 text-xl font-bold text-blue-600 relative group-hover:scale-110 transition-transform duration-500 shadow-sm">
                              {c.patientId?.name?.[0] || 'P'}
                            </div>
                            <div>
                              <h3 className="text-lg font-black text-slate-900 tracking-tight">{c.patientId?.name || 'Anonymous Patient'}</h3>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Ref: {c._id.slice(-6).toUpperCase()}</p>
                            </div>
                          </div>
                          <div className={`px-4 py-2 rounded-2xl border text-[9px] font-bold uppercase tracking-[0.2em] shadow-sm ${
                            c.priority === 'high' 
                              ? 'bg-red-50 border-red-100 text-red-500' 
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}>
                            {c.priority === 'high' ? 'Critical' : 'Standard'}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 group-hover:border-blue-100 transition-colors">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                              <Waves className="w-3 h-3 text-slate-400" /> Symptom Stream
                            </p>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed line-clamp-2">&quot;{c.symptoms}&quot;</p>
                          </div>

                          {c.aiSuggestion && (
                            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                                <Brain className="w-12 h-12 text-blue-900" />
                              </div>
                              <p className="text-[9px] font-bold text-blue-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                <Zap className="w-3 h-3 text-blue-500" /> AI Hypothesis
                              </p>
                              <p className="text-sm text-slate-800 font-bold">{c.aiSuggestion}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          <Calendar className="w-3.5 h-3.5" /> 
                          {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="flex gap-2">
                          {filter === 'pending' && (
                            <motion.button 
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => updateStatus(c._id, 'reviewed')}
                              className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] px-5 py-3 rounded-2xl shadow-lg hover:bg-blue-600 transition-colors"
                            >
                              Initialize Eval
                            </motion.button>
                          )}
                          <button type="button" onClick={() => openCaseDiscussion(c._id)}
                            className="text-[9px] font-black uppercase tracking-widest px-4 py-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100">
                            Discuss Case
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'analyzer' && (
            <motion.div
              key="analyzer-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto space-y-12"
            >
              <div className="bg-white/80 backdrop-blur-md p-12 rounded-[3.5rem] border border-slate-200 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 opacity-50" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full" />
                
                <div className="relative z-10 flex flex-col items-center text-center mb-12">
                  <div className="w-20 h-20 rounded-[2.5rem] bg-blue-50 flex items-center justify-center border border-blue-100 mb-6 shadow-lg animate-float">
                    <Brain className="w-10 h-10 text-blue-600" />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Neural Diagnostic <span className="text-blue-600 font-light">Probe</span></h2>
                  <p className="text-slate-500 text-sm max-w-md font-medium">Initialize a manual clinical inference sequence. Input physiological symptoms for neural cross-referencing.</p>
                </div>

                <form onSubmit={handleManualAnalyze} className="space-y-8 relative z-10">
                  <div className="relative group">
                    <textarea 
                      required
                      value={analyzerSymptoms}
                      onChange={(e) => setAnalyzerSymptoms(e.target.value)}
                      placeholder="Input or dictate clinical observations..."
                      className="w-full bg-white border border-slate-200 shadow-sm rounded-[2.5rem] p-10 pr-24 text-slate-900 text-lg placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 h-64 transition-all resize-none font-medium leading-relaxed"
                    />
                    
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`absolute right-8 top-8 p-4 rounded-full transition-all duration-300 shadow-lg ${
                        isRecording 
                          ? 'bg-red-500 text-white animate-pulse shadow-red-500/30' 
                          : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                      title="Dictate observations"
                    >
                      {isRecording ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                    </button>

                    <div className="absolute bottom-8 right-10 flex items-center gap-3">
                      <Waves className="w-4 h-4 text-blue-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Biometric Sync Active</span>
                    </div>
                  </div>
                  
                  <motion.button 
                    disabled={analyzerLoading}
                    whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(59, 130, 246, 0.4)" }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-xl disabled:opacity-50 flex items-center justify-center gap-4 transition-all duration-500 text-xs"
                  >
                    {analyzerLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                    Execute Clinical Inference
                  </motion.button>
                </form>
              </div>

              {analyzerResult && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                  <div className="bg-white/80 backdrop-blur p-10 rounded-[3rem] border border-blue-100 shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-50/50" />
                    <div className="relative z-10">
                      <h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                        <Target className="w-4 h-4" /> Probabilistic Matches
                      </h3>
                      <div className="space-y-6">
                        {analyzerResult.predictions?.map((p: any, i: number) => (
                          <div key={i} className="space-y-3">
                            <div className="flex justify-between items-end">
                              <p className="text-lg font-black text-slate-900 tracking-tight">{p.disease}</p>
                              <p className="text-2xl font-black text-blue-600 tracking-tighter">{(p.confidence * 100).toFixed(0)}%</p>
                            </div>
                            <div className="h-3 w-full bg-white/50 rounded-full overflow-hidden relative border border-slate-200/50 shadow-inner">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${p.confidence * 100}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] rounded-full" 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/80 backdrop-blur p-10 rounded-[3rem] border border-emerald-100 shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-50/50" />
                    <div className="relative z-10">
                      <h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                        <TrendingUp className="w-4 h-4" /> Extracted Signatures
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {analyzerResult.symptoms_extracted?.map((s: string, i: number) => (
                          <span key={i} className="px-5 py-2.5 bg-white border border-emerald-100 rounded-2xl text-[10px] font-bold text-slate-700 uppercase tracking-widest shadow-sm hover:border-emerald-300 transition-colors">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/80 backdrop-blur p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Total Patients</p>
                  <p className="text-5xl font-black text-slate-900 tracking-tighter">{stats.pending + stats.reviewed + stats.completed}</p>
                  <p className="text-xs font-medium text-blue-600 mt-3">All time consultations</p>
                </div>
                <div className="bg-white/80 backdrop-blur p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Completion Rate</p>
                  <p className="text-5xl font-black text-emerald-500 tracking-tighter">
                    {(stats.pending + stats.reviewed + stats.completed) > 0 
                      ? Math.round((stats.completed / (stats.pending + stats.reviewed + stats.completed)) * 100) 
                      : 0}%
                  </p>
                  <p className="text-xs font-medium text-slate-500 mt-3">Cases fully resolved</p>
                </div>
                <div className="bg-white/80 backdrop-blur p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Critical Ratio</p>
                  <p className="text-5xl font-black text-red-500 tracking-tighter">
                    {(stats.pending + stats.reviewed + stats.completed) > 0 
                      ? Math.round((stats.highRisk / (stats.pending + stats.reviewed + stats.completed)) * 100) 
                      : 0}%
                  </p>
                  <p className="text-xs font-medium text-slate-500 mt-3">High priority cases</p>
                </div>
              </div>

              {/* Case Pipeline */}
              <div className="bg-white/80 backdrop-blur p-12 rounded-[3rem] border border-slate-200 shadow-sm">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-10">Case Pipeline</h3>
                <div className="space-y-8">
                  {[
                    { label: 'Pending Review', count: stats.pending, color: 'from-blue-400 to-blue-500', text: 'text-blue-600' },
                    { label: 'Under Evaluation', count: stats.reviewed, color: 'from-purple-400 to-purple-500', text: 'text-purple-600' },
                    { label: 'Completed', count: stats.completed, color: 'from-emerald-400 to-emerald-500', text: 'text-emerald-500' },
                    { label: 'Critical Priority', count: stats.highRisk, color: 'from-red-400 to-red-500', text: 'text-red-500' },
                  ].map((item) => {
                    const total = stats.pending + stats.reviewed + stats.completed;
                    const pct = total > 0 ? (item.count / total) * 100 : 0;
                    return (
                      <div key={item.label} className="space-y-3">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">{item.label}</span>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-2xl font-black ${item.text} tracking-tighter`}>{item.count}</span>
                            <span className="text-[10px] font-bold text-slate-400">{pct.toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Disease Distribution */}
              <div className="bg-white/80 backdrop-blur p-12 rounded-[3rem] border border-slate-200 shadow-sm">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8">AI Diagnosis Distribution</h3>
                {consultations.length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(
                      consultations.reduce((acc: Record<string, number>, c: any) => {
                        const disease = c.aiSuggestion || 'Undiagnosed';
                        acc[disease] = (acc[disease] || 0) + 1;
                        return acc;
                      }, {})
                    ).sort(([,a], [,b]) => (b as number) - (a as number)).slice(0, 8).map(([disease, count], i) => (
                      <div key={disease} className="flex items-center gap-5 p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 shadow-sm transition-all">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 text-sm font-black text-blue-600 shrink-0">
                          {i + 1}
                        </div>
                        <span className="text-sm font-bold text-slate-800 flex-1">{disease}</span>
                        <span className="text-xl font-black text-blue-600 tracking-tighter">{count as number}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm font-medium text-center py-10">No consultation data yet</p>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'records' && (
            <motion.div
              key="records-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="bg-white/80 backdrop-blur p-8 rounded-[3rem] border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8 px-2">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
                      <Zap className="w-6 h-6 text-blue-600" />
                    </div>
                    All Consultation Records
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-xl">{consultations.length} records</span>
                </div>

                {consultations.length > 0 ? (
                  <div className="space-y-4">
                    {consultations.map((c, i) => (
                      <motion.div 
                        key={c._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-6 p-5 bg-white border border-slate-100 rounded-[2rem] hover:border-blue-200 shadow-sm transition-all group"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center border border-blue-100 text-xl font-black text-blue-600 shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                          {c.patientId?.name?.[0] || 'P'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-black text-slate-900 truncate">{c.patientId?.name || 'Anonymous'}</p>
                          <p className="text-xs text-slate-500 truncate mt-1 font-medium">{c.symptoms}</p>
                        </div>
                        <div className="hidden md:block text-right px-4">
                          <p className="text-xs font-bold text-blue-600">{c.aiSuggestion || '—'}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        <div className={`px-4 py-2.5 rounded-2xl border text-[9px] font-bold uppercase tracking-[0.2em] shrink-0 shadow-sm ${
                          c.status === 'completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                          : c.status === 'reviewed' ? 'bg-purple-50 border-purple-100 text-purple-600'
                          : 'bg-blue-50 border-blue-100 text-blue-600'
                        }`}>
                          {c.status}
                        </div>
                        <div className={`px-4 py-2.5 rounded-2xl border text-[9px] font-bold uppercase tracking-[0.2em] shrink-0 shadow-sm ${
                          c.priority === 'high' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}>
                          {c.priority === 'high' ? 'Critical' : 'Normal'}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-slate-100">
                    <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-400 text-sm font-medium">No records found</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
