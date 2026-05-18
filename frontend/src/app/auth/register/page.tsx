"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Loader2, ArrowRight, ShieldCheck, Stethoscope, Radio, Zap, Brain, Dna } from 'lucide-react';
import Link from 'next/link';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'patient', specialization: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      router.push('/auth/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const specializations = [
    'General Physician', 'Cardiologist', 'Dermatologist',
    'Neurologist', 'Pediatrician', 'Psychiatrist', 'Orthopedic'
  ];

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden py-20 bg-slate-50 text-slate-900">
      <div className="medical-bg" />
      <div className="medical-grid opacity-40" />
      
      {/* Ambient Glows */}
      <div className="absolute top-[5%] right-[5%] w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[5%] left-[5%] w-80 h-80 bg-cyan-400/10 blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 bg-white/70 backdrop-blur-2xl rounded-[3rem] border border-slate-200/60 overflow-hidden shadow-2xl relative z-10"
      >
        <div className="scan-line opacity-10" />
        
        {/* Left Panel — Branding & Features */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-blue-50/50 to-slate-50/50 border-r border-slate-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
            <img src="/logo.png" className="w-64 h-64 rotate-12 mix-blend-multiply" alt="" />
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col items-start gap-4 mb-10">
              <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-lg shadow-blue-500/10 border border-slate-200 bg-white flex items-center justify-center">
                <img src="/logo.png" alt="Clinica.Diff" className="w-12 h-12 object-contain mix-blend-multiply" />
              </div>
            </div>
            
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight mb-6">
              Join the future of <br /> <span className="text-blue-600 font-light">Medical OS.</span>
            </h1>
            
            <p className="text-slate-500 text-sm mb-12 max-w-sm leading-relaxed font-medium">
              Experience a unified ecosystem for clinical intelligence, genetic mapping, and diagnostic accuracy.
            </p>

            <div className="grid grid-cols-1 gap-4">
              {[
                { title: 'Neural Diagnostics', desc: 'Symptom analysis powered by LLMs', icon: Brain },
                { title: 'Smart Ingestion', desc: 'Neural OCR for medical records', icon: Zap },
                { title: 'Genetic Map', desc: 'Predictive hereditary profiling', icon: Dna },
              ].map((f, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  key={f.title} 
                  className="p-6 bg-white/60 backdrop-blur-md rounded-3xl border border-slate-200 hover:border-blue-300 transition-all group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-sm">
                      <f.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 tracking-tight">{f.title}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.1em] mt-1">{f.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="relative z-10 pt-10">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Global Nodes Active</p>
            </div>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="p-12 lg:p-16 flex flex-col justify-center relative overflow-y-auto max-h-[90vh] bg-white/40">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Create <span className="text-blue-600 font-light">Bio-ID</span></h2>
            <p className="text-slate-500 text-sm font-medium">Initialize your clinical profile today.</p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="bg-red-50 border border-red-100 text-red-500 p-4 rounded-xl mb-6 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 shadow-sm"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Full Name</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input type="text" value={formData.name} placeholder="John Doe" required
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-6 py-3.5 bg-white/80 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all font-medium text-sm shadow-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Bio-Identity (Email)</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input type="email" value={formData.email} placeholder="name@medical.os" required
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-6 py-3.5 bg-white/80 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all font-medium text-sm shadow-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Access Cipher (Password)</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input type="password" value={formData.password} placeholder="••••••••••••" required
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-6 py-3.5 bg-white/80 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all font-medium text-sm shadow-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Neural Role</label>
              <div className="grid grid-cols-2 gap-3">
                {['patient', 'doctor'].map(r => (
                  <button type="button" key={r} onClick={() => setFormData({ ...formData, role: r })}
                    className={`py-3.5 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                      formData.role === r
                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                        : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 shadow-sm'
                    }`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {formData.role === 'doctor' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2 mt-2 block">Clinical Domain</label>
                  <div className="relative group">
                    <Stethoscope className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" />
                    <select value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="w-full pl-12 pr-6 py-3.5 bg-white/80 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all font-medium text-sm appearance-none cursor-pointer shadow-sm">
                      <option value="">Select Domain</option>
                      {specializations.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)" }} whileTap={{ scale: 0.98 }} disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg mt-6 text-[10px] transition-all">
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  Initialize Bio-ID
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </motion.button>

            <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-[0.1em] pt-4">
              Already initialized?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 transition-colors underline underline-offset-4">
                Access Portal
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
