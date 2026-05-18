"use client";
import { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { ClinicalProvider, useClinical } from '@/context/ClinicalContext';
import VoiceSymptomInput from '@/components/features/VoiceSymptomInput';
import MultimodalDiagnosis from '@/components/features/MultimodalDiagnosis';
import MedicineScanner from '@/components/features/MedicineScanner';
import AdherenceCoach from '@/components/features/AdherenceCoach';
import AppointmentBooking from '@/components/features/AppointmentBooking';
import io from 'socket.io-client';
import { API_BASE } from '@/lib/api';
import { 
  Stethoscope, Activity, FileText, Zap, Brain, Upload,
  ShieldCheck, CheckCircle2, AlertTriangle, Loader2, X,
  Radio, Waves, Target, TrendingUp, ChevronRight,
  HeartPulse, FlaskConical, Bell, LayoutGrid, Camera, Scan, Mic, Users, Calendar
} from 'lucide-react';

type PatientTab = 'hub' | 'symptoms' | 'multimodal' | 'prescription' | 'scanner' | 'adherence' | 'appointments';

export default function PatientDashboard() {
  return (
    <ClinicalProvider>
      <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
        <PatientDashboardInner />
      </Suspense>
    </ClinicalProvider>
  );
}

function PatientDashboardInner() {
  const { updateSnapshot } = useClinical();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [symptomDays, setSymptomDays] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as PatientTab | null;
  const [activeTab, setActiveTab] = useState<PatientTab>(tabParam || 'hub');

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [outbreak, setOutbreak] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [diseaseInference, setDiseaseInference] = useState<any>(null);
  const [inferLoading, setInferLoading] = useState(false);
  const [ddiResult, setDdiResult] = useState<any>(null);
  const [ddiLoading, setDdiLoading] = useState(false);
  const [notification, setNotification] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchDoctors(); }, [specialization]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};
    if (!user.id) return;
    const socket = io(API_BASE);
    socket.emit('join_patient', user.id);
    socket.on('prescription_disease_alert', (data: any) => {
      setNotification(data);
      setTimeout(() => setNotification(null), 15000);
    });
    return () => { socket.disconnect(); };
  }, []);

  const fetchDoctors = async () => {
    try {
      const url = specialization
        ? `${API_BASE}/api/users/doctors?specialization=${specialization}`
        : `${API_BASE}/api/users/doctors`;
      const data = await (await fetch(url)).json();
      setDoctors(data);
    } catch (err) { console.error(err); }
  };

  const handleSymptomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch(`${API_BASE}/api/ai/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms,
          age: patientAge || undefined,
          duration_days: symptomDays || undefined,
          doctorId: selectedDoctor,
          patientId: user.id,
          patientName: user.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || data.message || 'Symptom analysis failed. Is the AI server running on port 5001?');
        return;
      }
      setResult(data);
      updateSnapshot({
        symptoms,
        predictions: data.predictions || [],
        source: 'symptoms',
      });
      const ob = await (await fetch(`${API_BASE}/api/ai/detect-outbreaks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: 'Mumbai', symptoms: data.symptoms_extracted })
      })).json();
      if (ob.outbreak_detected) setOutbreak(ob.outbreak_data);
      if (!selectedDoctor) {
        alert('Please select a doctor above so your analysis is sent to them in real time.');
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleOcrSubmit = async () => {
    if (!file) return;
    setOcrLoading(true);
    setOcrResult(null);
    setDiseaseInference(null);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch(`${API_BASE}/api/ai/ocr`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          doctorId: selectedDoctor,
          patientId: user.id,
          patientName: user.name,
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || data.message || 'Prescription analysis failed. Is the AI server running on port 5001?');
        return;
      }
      setOcrResult(data);
      updateSnapshot({
        symptoms: data.diagnosis || '',
        predictions: data.disease_inference?.primary_disease
          ? [{ disease: data.disease_inference.primary_disease, confidence: 0.85, severity: data.disease_inference.severity || 'moderate', body_part: 'general' }]
          : [],
        medications: data.medications || [],
        source: 'prescription',
      });

      const inferFromOcr = data.disease_inference;
      if (inferFromOcr?.primary_disease) {
        setDiseaseInference({ status: 'success', engine: 'groq_vision', ...inferFromOcr });
      } else if (data.drugs_found?.length > 0 || data.medications?.length > 0) {
        setInferLoading(true);
        try {
          const infer = await fetch(`${API_BASE}/api/ai/infer-disease-from-prescription`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              drugs_found: data.drugs_found || [],
              medications: data.medications || [],
              diagnosis: data.diagnosis || '',
              doctorId: selectedDoctor,
              patientId: user.id,
              patientName: user.name
            })
          });
          const inferData = await infer.json();
          if (infer.ok) setDiseaseInference(inferData);
        } catch (e) { console.error(e); } finally { setInferLoading(false); }
      }

      if (data.drugs_found?.length > 0 || data.medications?.length > 0) {
        checkInteractions(data.drugs_found || []);
      }
    } catch (err) { console.error(err); } finally { setOcrLoading(false); }
  };

  const checkInteractions = async (newDrugs: string[]) => {
    setDdiLoading(true);
    try {
      const data = await (await fetch(`${API_BASE}/api/ai/check-interaction`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_drugs: newDrugs, existing_meds: ['Aspirin', 'Metformin'] })
      })).json();
      setDdiResult(data);
    } catch (err) { console.error(err); } finally { setDdiLoading(false); }
  };

  const featureTabs: { id: PatientTab; label: string; icon: typeof Activity }[] = [
    { id: 'symptoms', label: 'Symptoms & Voice', icon: Mic },
    { id: 'multimodal', label: 'Photo + AI', icon: Camera },
    { id: 'prescription', label: 'Prescription', icon: FileText },
    { id: 'scanner', label: 'Med Scanner', icon: Scan },
    { id: 'adherence', label: 'Adherence', icon: Bell },
  ];

  const hubFeatures = [
    { id: 'symptoms' as PatientTab, title: 'Universal Symptom Analyzer', desc: 'Groq AI screens 8–12 conditions globally', icon: Activity },
    { id: 'multimodal' as PatientTab, title: 'Multimodal Diagnosis', desc: 'Upload rash, wound, or skin photo + symptoms', icon: Camera },
    { id: 'prescription' as PatientTab, title: 'Prescription AI', desc: 'Groq Vision reads handwritten Rx', icon: FileText },
    { id: 'scanner' as PatientTab, title: 'AR Medicine Scanner', desc: 'Scan any medicine box or strip', icon: Scan },
    { id: 'adherence' as PatientTab, title: 'Adherence Coach', desc: 'Daily dose reminders & streak tracking', icon: Bell }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-12 pb-20 relative">
        {/* Ambient Glows */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-4">
              <Radio className="w-4 h-4 text-blue-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600">Bio-Link Established</span>
            </motion.div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Medical <span className="text-blue-600 font-light">OS Hub</span>
            </h1>
          </div>

          <motion.div className="bg-white/80 backdrop-blur-xl p-2 rounded-3xl border border-slate-200/60 flex gap-1 shadow-lg shadow-blue-500/5 flex-nowrap overflow-x-auto scrollbar-hide w-full md:w-auto">
            {featureTabs.map(t => (
              <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all duration-300 relative overflow-hidden group ${
                  activeTab === t.id ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}>
                <t.icon className={`w-4 h-4 transition-colors ${activeTab === t.id ? 'text-blue-600' : 'group-hover:text-blue-500'}`} />
                {t.label}
                {activeTab === t.id && (
                  <motion.div layoutId="tab-pill-patient" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full" />
                )}
              </button>
            ))}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Panel */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">

              {activeTab === 'hub' && (
                <motion.div key="hub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {hubFeatures.map((f) => (
                      <button key={f.id} type="button" onClick={() => setActiveTab(f.id)}
                        className="text-left p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm hover:border-blue-300 transition-all">
                        <f.icon className="w-8 h-8 text-blue-600 mb-4" />
                        <h3 className="text-lg font-black text-slate-900 mb-2">{f.title}</h3>
                        <p className="text-sm text-slate-500 font-medium">{f.desc}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'multimodal' && (
                <motion.div key="mm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <MultimodalDiagnosis selectedDoctor={selectedDoctor} patientAge={patientAge} />
                </motion.div>
              )}

              {activeTab === 'scanner' && (
                <motion.div key="sc" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <MedicineScanner selectedDoctor={selectedDoctor} />
                </motion.div>
              )}

              {activeTab === 'adherence' && (
                <motion.div key="ad" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <AdherenceCoach medications={ocrResult?.medications} selectedDoctor={selectedDoctor} />
                </motion.div>
              )}

              {activeTab === 'appointments' && (
                <motion.div key="appt" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <AppointmentBooking
                    doctors={doctors}
                    selectedDoctor={selectedDoctor}
                    onSelectDoctor={setSelectedDoctor}
                    specialization={specialization}
                    onSpecializationChange={setSpecialization}
                  />
                </motion.div>
              )}

              {/* SYMPTOMS TAB */}
              {activeTab === 'symptoms' && (
                <motion.div key="sym" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                  {/* Doctor Selection */}
                  <div className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm p-8 rounded-[2.5rem]">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-xl font-black text-slate-900 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                          <Stethoscope className="w-6 h-6 text-blue-600" />
                        </div>
                        Clinical Domain
                      </h2>
                      <div className="relative group">
                        <select onChange={(e) => setSpecialization(e.target.value)}
                          className="bg-white border border-slate-200 shadow-sm rounded-2xl px-6 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-widest appearance-none pr-12 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all cursor-pointer hover:border-slate-300">
                          <option value="">All Domains</option>
                          {['General Physician','Cardiologist','Dermatologist','Neurologist','Pediatrician','Psychiatrist','Orthopedic'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {doctors.map(doc => (
                        <button key={doc._id} onClick={() => setSelectedDoctor(doc._id)}
                          className={`p-5 rounded-[2rem] border text-left flex items-center gap-4 transition-all duration-300 relative overflow-hidden group ${
                            selectedDoctor === doc._id ? 'bg-blue-50/50 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-md'
                          }`}>
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all duration-500 shadow-sm ${
                            selectedDoctor === doc._id ? 'bg-blue-600 text-white shadow-blue-600/30' : 'bg-slate-50 text-slate-400 border border-slate-100'
                          }`}>
                            {doc.name[0]}
                          </div>
                          <div>
                            <p className={`text-base font-black transition-colors ${selectedDoctor === doc._id ? 'text-slate-900' : 'text-slate-700'}`}>Dr. {doc.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{doc.specialization || 'Clinical Lead'}</p>
                          </div>
                          {selectedDoctor === doc._id && <CheckCircle2 className="w-5 h-5 text-blue-500 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Symptom Input */}
                  <div className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-xl p-10 rounded-[3.5rem] relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 opacity-50" />
                    <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                        <Brain className="w-6 h-6 text-blue-600" />
                      </div>
                      Universal Symptom Analyzer
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mb-6 -mt-4">
                      Groq AI screens infections, chronic disease, rare disorders, mental health, tropical diseases, and more.
                    </p>
                    <form onSubmit={handleSymptomSubmit} className="space-y-8">
                      <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem]">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center mb-6">Voice Symptom Intake</p>
                        <VoiceSymptomInput value={symptoms} onChange={setSymptoms} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Age (optional)</label>
                          <input type="number" min="0" max="120" value={patientAge} onChange={(e) => setPatientAge(e.target.value)}
                            placeholder="e.g. 28"
                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-400" />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Duration (days)</label>
                          <input type="number" min="0" value={symptomDays} onChange={(e) => setSymptomDays(e.target.value)}
                            placeholder="e.g. 3"
                            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-400" />
                        </div>
                      </div>
                      <div className="relative group">
                        <textarea required value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
                          placeholder="Describe ALL symptoms — location, severity, fever, rash, mood, travel, meds, when it started..."
                          className="w-full bg-white border border-slate-200 shadow-sm rounded-[2.5rem] p-10 text-slate-900 text-lg placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 h-64 transition-all resize-none font-medium leading-relaxed" />
                        <div className="absolute bottom-8 right-10 flex items-center gap-3">
                          <Waves className="w-4 h-4 text-blue-500 animate-pulse" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.4em]">Groq Universal Triage Active</span>
                        </div>
                      </div>
                      {!selectedDoctor && (
                        <p className="text-[10px] text-amber-600 font-bold text-center uppercase tracking-widest">
                          Select your doctor above — all analyses are sent to them in real time
                        </p>
                      )}
                      <motion.button disabled={loading}
                        whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(59, 130, 246, 0.4)" }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-xl disabled:opacity-50 flex items-center justify-center gap-4 transition-all duration-500 text-xs">
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                        Run Universal Analysis
                      </motion.button>
                    </form>

                    {/* ── ADVANCED SYMPTOM RESULTS ── */}
                    {result?.predictions?.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 mt-10">
                        {result.emergency_now && (
                          <div className="p-6 bg-red-50 border-2 border-red-200 rounded-[2rem] flex items-start gap-4">
                            <AlertTriangle className="w-8 h-8 text-red-500 shrink-0" />
                            <div>
                              <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2">Seek Emergency Care Now</p>
                              <p className="text-sm text-red-900 font-bold">{result.emergency_reason || 'Your symptoms may need immediate emergency attention.'}</p>
                            </div>
                          </div>
                        )}

                        <div className="bg-white border border-slate-200 shadow-sm p-8 rounded-[2.5rem]">
                          <div className="flex flex-wrap items-center gap-3 mb-6">
                            <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                              result.urgency_level === 'emergency' ? 'bg-red-50 border-red-200 text-red-600'
                              : result.urgency_level === 'urgent' ? 'bg-amber-50 border-amber-200 text-amber-600'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            }`}>{result.urgency_level || 'routine'} priority</span>
                            <span className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl text-[9px] font-bold text-blue-600 uppercase tracking-widest">
                              See: {result.recommended_specialist || 'General Physician'}
                            </span>
                            <span className="px-4 py-2 bg-slate-100 rounded-xl text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                              {result.prediction_count || result.predictions.length} conditions screened
                            </span>
                          </div>
                          {result.clinical_summary && (
                            <p className="text-base text-slate-700 font-medium leading-relaxed mb-6">{result.clinical_summary}</p>
                          )}
                          {result.possible_causes_layman?.length > 0 && (
                            <div className="mb-6 p-5 bg-blue-50/50 border border-blue-100 rounded-2xl">
                              <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-3">What Might Be Going On</p>
                              <ul className="space-y-2">
                                {result.possible_causes_layman.map((line: string, i: number) => (
                                  <li key={i} className="text-sm text-slate-700 font-medium flex gap-2"><span className="text-blue-500">•</span>{line}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] px-2">
                          Top Matches ({result.predictions.length} diseases analyzed)
                        </h4>
                        {result.predictions.map((p: any, i: number) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            className={`bg-white border shadow-sm p-8 rounded-[2rem] hover:border-blue-200 transition-all ${
                              i === 0 ? 'border-blue-200 ring-2 ring-blue-100' : 'border-slate-200'
                            }`}>
                            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                  {i === 0 && <span className="px-3 py-1 bg-blue-600 text-white text-[8px] font-black uppercase rounded-lg">Most Likely</span>}
                                  {p.is_rare && <span className="px-3 py-1 bg-purple-50 border border-purple-200 text-purple-600 text-[8px] font-black uppercase rounded-lg">Rare</span>}
                                  <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[8px] font-bold uppercase rounded-lg">{p.disease_category || p.body_part}</span>
                                </div>
                                <h5 className="text-xl font-black text-slate-900">{p.disease}</h5>
                                <p className="text-xs text-slate-500 font-medium mt-1">{p.specialist} • {p.body_part}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-3xl font-black text-blue-600">{(p.confidence * 100).toFixed(0)}%</p>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${
                                  p.severity === 'critical' ? 'text-red-500' : p.severity === 'high' ? 'text-amber-500' : 'text-slate-400'
                                }`}>{p.severity}</span>
                              </div>
                            </div>
                            {p.layman_explanation && (
                              <p className="text-sm text-slate-600 font-medium mb-4 leading-relaxed">{p.layman_explanation}</p>
                            )}
                            {p.matched_symptoms?.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {p.matched_symptoms.map((s: string, si: number) => (
                                  <span key={si} className="px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-600">{s}</span>
                                ))}
                              </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                                <p className="text-[9px] font-bold text-emerald-600 uppercase mb-2">Do Now</p>
                                <p className="text-sm text-slate-700 font-medium">{p.immediate_action}</p>
                              </div>
                              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
                                <p className="text-[9px] font-bold text-amber-600 uppercase mb-2">Watch For</p>
                                <ul className="space-y-1">
                                  {(p.watch_out_for || []).slice(0, 3).map((w: string, wi: number) => (
                                    <li key={wi} className="text-xs text-amber-900 font-medium">• {w}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </motion.div>
                        ))}

                        {(result.differential_diagnosis?.length > 0 || result.home_care_steps?.length > 0) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {result.differential_diagnosis?.length > 0 && (
                              <div className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-4">Must Rule Out</p>
                                <ul className="space-y-2">
                                  {result.differential_diagnosis.map((d: string, i: number) => (
                                    <li key={i} className="text-sm text-slate-700 font-medium flex gap-2"><Target className="w-4 h-4 text-blue-500 shrink-0" />{d}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {result.home_care_steps?.length > 0 && (
                              <div className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-4">Safe Home Care</p>
                                <ul className="space-y-2">
                                  {result.home_care_steps.map((s: string, i: number) => (
                                    <li key={i} className="text-sm text-slate-700 font-medium flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {result.questions_for_doctor?.length > 0 && (
                          <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-[2rem]">
                            <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mb-4">Ask Your Doctor</p>
                            <ul className="space-y-2">
                              {result.questions_for_doctor.map((q: string, i: number) => (
                                <li key={i} className="text-sm text-indigo-900 font-medium">• {q}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <p className="text-[10px] text-slate-400 font-medium text-center px-4">
                          AI decision support only — not a medical diagnosis. Always consult a licensed healthcare provider.
                        </p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* OCR TAB */}
              {activeTab === 'prescription' && (
                <motion.div key="ocr" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                  <div className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm p-16 rounded-[3.5rem] text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-50/20" />
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setPreviewUrl(URL.createObjectURL(f)); } }} />
                    {!previewUrl ? (
                      <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer space-y-6 relative z-10">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-white border border-slate-200 flex items-center justify-center mx-auto group-hover:scale-110 transition-all duration-500 shadow-xl shadow-blue-500/10 text-blue-600">
                          <Upload className="w-10 h-10" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase">Bio-Data Ingestion</h3>
                          <p className="text-slate-500 text-sm font-medium">Upload a photo — Groq AI reads it and explains each medicine in simple steps</p>
                        </div>
                        <div className="flex justify-center gap-4 pt-4">
                          {['DICOM', 'NEURAL-MAP', 'RAW-SYNC'].map(tag => (
                            <span key={tag} className="text-[9px] font-bold text-slate-400 bg-white border border-slate-100 shadow-sm px-4 py-2 rounded-full uppercase tracking-widest group-hover:text-blue-500 transition-colors">{tag}</span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8 relative z-10">
                        <div className="relative inline-block group/img">
                          <img src={previewUrl} className="max-h-80 rounded-[2.5rem] border border-slate-200 shadow-2xl group-hover/img:scale-[1.02] transition-transform duration-500" alt="Preview" />
                          <button onClick={() => { setPreviewUrl(null); setFile(null); }}
                            className="absolute -top-4 -right-4 p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-transform shadow-xl z-10">
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <motion.button onClick={handleOcrSubmit} disabled={ocrLoading}
                          whileHover={{ scale: 1.02 }}
                          className="w-full max-w-md mx-auto py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-xl shadow-blue-600/30 flex items-center justify-center gap-4 text-xs disabled:opacity-50 transition-all">
                          {ocrLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                          Analyze Prescription
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {ocrResult && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      {/* Header Card */}
                      <div className="bg-white/80 backdrop-blur-md p-8 rounded-[3rem] border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="text-xl font-black text-slate-900 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                              <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            Prescription Analysis
                          </h3>
                          <div className="flex items-center gap-4">
                            {ocrResult.trust_ledger && (
                              <div className={`px-5 py-2.5 rounded-2xl border text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm ${ocrResult.trust_ledger.signature_detected ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                                <ShieldCheck className="w-4 h-4" />
                                {ocrResult.trust_ledger.signature_detected ? 'Verified' : 'Unverified'}
                              </div>
                            )}
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-2.5 rounded-2xl">Engine: {ocrResult.engine?.toUpperCase()}</span>
                          </div>
                        </div>

                        {/* Diagnosis & Patient Info */}
                        {(ocrResult.diagnosis || ocrResult.patient_info) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                            {ocrResult.diagnosis && (
                              <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-[2rem] shadow-sm">
                                <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-3">Diagnosis</p>
                                <p className="text-base text-slate-900 font-bold">{ocrResult.diagnosis}</p>
                              </div>
                            )}
                            {ocrResult.patient_info && (ocrResult.patient_info.age || ocrResult.patient_info.name) && (
                              <div className="p-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] shadow-sm">
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Patient Info</p>
                                <div className="space-y-1.5">
                                  {ocrResult.patient_info.name && <p className="text-sm text-slate-500 font-medium">Name: <span className="text-slate-900 font-bold">{ocrResult.patient_info.name}</span></p>}
                                  {ocrResult.patient_info.age && <p className="text-sm text-slate-500 font-medium">Age: <span className="text-slate-900 font-bold">{ocrResult.patient_info.age}</span></p>}
                                  {ocrResult.patient_info.date && <p className="text-sm text-slate-500 font-medium">Date: <span className="text-slate-900 font-bold">{ocrResult.patient_info.date}</span></p>}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Structured Medications List */}
                      {ocrResult.medications && ocrResult.medications.length > 0 ? (
                        <div className="space-y-5">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] px-4">Your Medications ({ocrResult.medications.length})</h4>
                          {ocrResult.medications.map((med: any, i: number) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                              className="bg-white border border-slate-200 shadow-sm p-8 rounded-[2.5rem] hover:border-blue-200 transition-all hover:shadow-md group">
                              <div className="flex items-start gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 text-xl font-black text-blue-600 shrink-0 shadow-sm">
                                  {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-4 mb-5">
                                    <div>
                                      <h5 className="text-xl font-black text-slate-900 tracking-tight">{med.drug_name}</h5>
                                      {med.generic_name && med.generic_name !== med.drug_name && (
                                        <p className="text-xs text-slate-500 font-medium mt-1">({med.generic_name})</p>
                                      )}
                                    </div>
                                    {med.form && (
                                      <span className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[9px] font-bold text-slate-500 uppercase tracking-widest shrink-0 shadow-sm">{med.form}</span>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    {med.dosage && (
                                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Dosage</p>
                                        <p className="text-sm text-slate-900 font-bold">{med.dosage}</p>
                                      </div>
                                    )}
                                    {med.frequency && (
                                      <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                        <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-2">Frequency</p>
                                        <p className="text-sm text-blue-600 font-bold">{med.frequency}</p>
                                      </div>
                                    )}
                                    {med.duration && (
                                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Duration</p>
                                        <p className="text-sm text-slate-900 font-bold">{med.duration}</p>
                                      </div>
                                    )}
                                    {med.timing && (
                                      <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-2">Timing</p>
                                        <p className="text-sm text-emerald-600 font-bold">{med.timing}</p>
                                      </div>
                                    )}
                                  </div>
                                  {med.instructions && (
                                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                                      <p className="text-sm text-slate-600 font-medium leading-relaxed"><span className="text-blue-600 font-bold">Note:</span> {med.instructions}</p>
                                    </div>
                                  )}
                                  {med.layman_guide && (
                                    <div className="mt-2 p-6 bg-emerald-50/50 border border-emerald-100 rounded-[2rem] space-y-5">
                                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Simple Guide For You</p>
                                      {med.layman_guide.what_is_this_medicine && (
                                        <p className="text-sm text-slate-700 font-medium leading-relaxed">{med.layman_guide.what_is_this_medicine}</p>
                                      )}
                                      {med.layman_guide.how_to_take?.length > 0 && (
                                        <div>
                                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">How To Take (Step by Step)</p>
                                          <ul className="space-y-2">
                                            {med.layman_guide.how_to_take.map((step: string, si: number) => (
                                              <li key={si} className="flex gap-3 text-sm text-slate-700 font-medium">
                                                <span className="w-6 h-6 rounded-lg bg-white border border-emerald-100 flex items-center justify-center text-[10px] font-black text-emerald-600 shrink-0">{si + 1}</span>
                                                <span className="pt-0.5">{step.replace(/^Step\s*\d+:\s*/i, '')}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {med.layman_guide.what_it_does_for_you?.length > 0 && (
                                        <div>
                                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">What It Does</p>
                                          <ul className="space-y-1.5">
                                            {med.layman_guide.what_it_does_for_you.map((b: string, bi: number) => (
                                              <li key={bi} className="text-sm text-slate-600 font-medium flex gap-2"><span className="text-emerald-500">•</span>{b}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {med.layman_guide.side_effects_to_watch?.length > 0 && (
                                        <div>
                                          <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-2">Watch For</p>
                                          <ul className="space-y-1.5">
                                            {med.layman_guide.side_effects_to_watch.map((b: string, bi: number) => (
                                              <li key={bi} className="text-sm text-amber-900/80 font-medium flex gap-2"><span>•</span>{b}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {med.layman_guide.important_warnings?.length > 0 && (
                                        <div>
                                          <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest mb-2">Important</p>
                                          <ul className="space-y-1.5">
                                            {med.layman_guide.important_warnings.map((b: string, bi: number) => (
                                              <li key={bi} className="text-sm text-red-800/80 font-medium flex gap-2"><span>•</span>{b}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        /* Fallback: show raw patient_summary if no structured medications */
                        <div className="bg-white border border-slate-200 shadow-sm p-8 rounded-[2.5rem]">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Prescription Summary</p>
                          <div className="space-y-3">
                            {ocrResult.patient_summary?.split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => (
                              <p key={i} className={`text-sm leading-relaxed ${
                                line.startsWith('[') ? 'text-blue-600 font-bold uppercase tracking-widest text-[10px] mt-4' 
                                : line.match(/^\d+\./) ? 'text-slate-800 font-bold pl-4' 
                                : 'text-slate-600 font-medium'
                              }`}>{line}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Special Notes */}
                      {ocrResult.special_notes && (
                        <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-start gap-4 shadow-sm">
                          <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2">Doctor's Notes</p>
                            <p className="text-sm text-amber-900 font-medium">{ocrResult.special_notes}</p>
                          </div>
                        </div>
                      )}

                      {/* Drugs Found Tags */}
                      {ocrResult.drugs_found?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {ocrResult.drugs_found.map((drug: string, i: number) => (
                            <span key={i} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">{drug}</span>
                          ))}
                        </div>
                      )}

                      {/* Disease Inference Loading */}
                      {inferLoading && (
                        <div className="p-10 bg-white border border-slate-200 shadow-sm rounded-[2.5rem] flex items-center gap-6">
                          <Loader2 className="w-8 h-8 text-blue-500 animate-spin shrink-0" />
                          <div>
                            <p className="text-base font-black text-slate-900">AI Analyzing Prescription...</p>
                            <p className="text-xs text-slate-500 font-medium mt-1">Inferring condition from medications. Notifying your doctor.</p>
                          </div>
                        </div>
                      )}

                      {/* Disease Inference Result */}
                      {diseaseInference && diseaseInference.primary_disease && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                          className={`bg-white border shadow-md p-10 rounded-[3rem] ${
                            diseaseInference.severity === 'critical' ? 'border-red-200'
                            : diseaseInference.severity === 'high' ? 'border-amber-200'
                            : 'border-blue-200'
                          }`}>
                          <div className="flex items-start gap-6 mb-8">
                            <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shrink-0 shadow-inner ${
                              diseaseInference.severity === 'critical' ? 'bg-red-50 text-red-500 border border-red-100'
                              : diseaseInference.severity === 'high' ? 'bg-amber-50 text-amber-500 border border-amber-100'
                              : 'bg-blue-50 text-blue-500 border border-blue-100'
                            }`}>
                              <HeartPulse className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                              <p className={`text-[10px] font-bold uppercase tracking-[0.4em] mb-2 ${diseaseInference.severity === 'critical' ? 'text-red-500' : 'text-blue-500'}`}>AI Diagnosis Inference</p>
                              <h4 className="text-3xl font-black text-slate-900 tracking-tight">{diseaseInference.primary_disease}</h4>
                              <div className="flex flex-wrap gap-2 mt-4">
                                {diseaseInference.secondary_conditions?.map((sc: string, i: number) => (
                                  <span key={i} className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 uppercase tracking-widest">{sc}</span>
                                ))}
                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${
                                  diseaseInference.urgency === 'emergency' ? 'bg-red-50 border-red-100 text-red-600'
                                  : diseaseInference.urgency === 'urgent' ? 'bg-amber-50 border-amber-100 text-amber-600'
                                  : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                }`}>{diseaseInference.urgency?.replace('_',' ')}</span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Confidence</p>
                              <p className={`text-xl font-black capitalize ${
                                diseaseInference.confidence === 'high' ? 'text-emerald-500' : diseaseInference.confidence === 'medium' ? 'text-amber-500' : 'text-slate-400'
                              }`}>{diseaseInference.confidence}</p>
                            </div>
                          </div>

                          {/* Patient Explanation */}
                          {diseaseInference.patient_explanation && (
                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl mb-6">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">What This Means For You</p>
                              <p className="text-sm text-slate-700 font-medium leading-relaxed">{diseaseInference.patient_explanation}</p>
                            </div>
                          )}

                          {/* What This Means — Point Wise */}
                          {diseaseInference.what_this_means?.length > 0 && (
                            <div className="space-y-4 mb-6 px-2">
                              {diseaseInference.what_this_means.map((point: string, i: number) => (
                                <div key={i} className="flex gap-4 items-start">
                                  <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-[10px] font-black text-blue-600 shadow-sm">{i+1}</div>
                                  <p className="text-sm text-slate-700 font-medium leading-relaxed pt-1">{point}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Follow-up Tests */}
                          {diseaseInference.follow_up_tests?.length > 0 && (
                            <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-3xl">
                              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <FlaskConical className="w-4 h-4" /> Recommended Tests
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {diseaseInference.follow_up_tests.map((t: string, i: number) => (
                                  <span key={i} className="px-4 py-2 bg-white border border-blue-100 shadow-sm rounded-xl text-[10px] font-bold text-blue-700">{t}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-6 p-5 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4">
                            <Bell className="w-5 h-5 text-blue-500 shrink-0" />
                            <p className="text-xs font-bold text-blue-800">Your doctor has been notified about this prescription analysis in real-time.</p>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {ddiResult && ddiResult.interaction_count > 0 && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-red-200 shadow-lg p-10 rounded-[3rem]">
                      <div className="flex items-center gap-6 mb-10">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shadow-inner">
                          <AlertTriangle className="w-10 h-10" />
                        </div>
                        <div>
                          <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Critical Conflict</h3>
                          <p className="text-[10px] text-red-500 font-bold uppercase tracking-[0.3em] mt-2">DDI Sequence Analysis Triggered {ddiResult.interaction_count} Anomalies</p>
                        </div>
                      </div>
                      <div className="space-y-5">
                        {ddiResult.interactions.map((int: any, i: number) => (
                          <div key={i} className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] hover:border-red-200 transition-all">
                            <div className="flex items-center gap-4 mb-4">
                              <span className="px-5 py-2 bg-red-500 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-md">{int.severity}</span>
                              <p className="text-xl font-black text-slate-900 tracking-tight">{int.drugs.join(' + ')}</p>
                            </div>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed italic">&quot;{int.reason}&quot;</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {!['hub', 'multimodal', 'scanner', 'adherence', 'appointments'].includes(activeTab) && (
          <div className="lg:col-span-4 space-y-8">
            {/* ── NEURAL CORE OS SIDEBAR ── */}
            <div className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-xl p-10 rounded-[3rem] relative overflow-hidden group min-h-[500px] flex flex-col">
              {/* Background Neural Animation */}
              <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full animate-pulse" />
              </div>

              <div className="relative z-10 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">Neural Core v4.2</h3>
                  </div>
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>

                {/* Cinematic Pulse Orb */}
                <motion.div className="relative w-36 h-36 mx-auto mb-12">
                  <motion.div 
                    animate={{ scale: [1, 1.15, 1], rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border border-blue-200 border-t-blue-500" 
                  />
                  <motion.div 
                    animate={{ scale: [1, 0.85, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 blur-xl shadow-[0_0_30px_rgba(59,130,246,0.5)]" 
                  />
                  <motion.div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-14 h-14 rounded-full bg-white/90 border border-blue-100 shadow-inner flex items-center justify-center">
                      <Brain className="w-8 h-8 text-blue-600" strokeWidth={2.25} />
                    </div>
                  </motion.div>
                </motion.div>

                {/* Live Data Feed */}
                <div className="space-y-6 flex-1">
                  {(result || diseaseInference) ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      {/* Detailed Prediction List */}
                      <div className="space-y-4">
                        {(result?.predictions || []).slice(0, 5).map((p: any, i: number) => (
                          <motion.div key={i} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                            className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-blue-200 transition-all">
                            <div className="flex justify-between items-start mb-3">
                              <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate flex-1 pr-2">{p.disease}</p>
                              <span className="text-[10px] font-black text-blue-600">{(p.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${p.confidence * 100}%` }} className="h-full bg-blue-500" />
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Logic Logs */}
                      <div className="space-y-3 pt-5 border-t border-slate-100">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Inference Logic Logs</p>
                        <div className="font-mono text-[9px] space-y-2 text-slate-600 font-medium">
                          <p>{`> Initializing symptom cross-match...`}</p>
                          <p className="text-emerald-600 font-bold">{`> Pattern detected: ${result?.predictions?.[0]?.disease || 'Analyzing'}`}</p>
                          <p>{`> Confidence interval: high_confidence`}</p>
                          <p className="animate-pulse text-blue-600 font-bold">{`> Syncing analysis to assigned doctor...`}</p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 space-y-5">
                      <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Awaiting Neural Sync</p>
                      <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                    </div>
                  )}
                </div>

                {/* Simulated Vitals Footer */}
                <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Neural Sync</p>
                    <p className="text-xs font-black text-emerald-500 tracking-tighter">99.8% STABLE</p>
                  </div>
                  <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-right">
                    <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mb-1.5">Bio-Link</p>
                    <p className="text-xs font-black text-blue-600 tracking-tighter">ESTABLISHED</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Outbreak Alert */}
            {outbreak && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-amber-200 shadow-lg p-10 rounded-[3rem] relative overflow-hidden">
                <div className="absolute inset-0 bg-amber-50/50" />
                <div className="relative z-10">
                  <h3 className="text-[10px] font-bold text-amber-600 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
                    <Users className="w-4 h-4 animate-pulse" /> Regional Threat
                  </h3>
                  <div className="p-6 bg-white rounded-2xl border border-amber-100 mb-6 shadow-sm">
                    <p className="text-[9px] font-bold text-amber-500 uppercase tracking-[0.3em] mb-2">{outbreak.city} Zone</p>
                    <p className="text-lg font-black text-slate-900 mb-2 tracking-tight">Cluster: {outbreak.disease}</p>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed italic">&quot;{outbreak.recommendation}&quot;</p>
                  </div>
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Cases: {outbreak.active_cases}</span>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 rounded-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-[9px] font-bold text-amber-700 uppercase tracking-widest">High Awareness</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Core Systems */}
            <div className="bg-white border border-slate-200 shadow-sm p-8 rounded-[2.5rem]">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mb-6 px-2">System Integrity</h3>
              <div className="space-y-3">
                {[
                  { label: 'Neural Engine', status: 'Optimal', icon: Brain, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                  { label: 'Trust Ledger', status: 'Secured', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
                  { label: 'DDI Safety', status: 'Active', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-slate-300 transition-all hover:bg-white hover:shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center ${s.color}`}>
                        <s.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{s.label}</span>
                    </div>
                    <span className={`text-[9px] font-black ${s.color} uppercase tracking-widest px-3 py-1.5 rounded-lg ${s.bg}`}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
