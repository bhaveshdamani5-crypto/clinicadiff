"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, Radio, Fingerprint, Stethoscope } from 'lucide-react';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Authentication failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push(data.user.role === 'doctor' ? '/dashboard/doctor' : '/dashboard/patient');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-50 text-slate-900">
      <div className="medical-bg" />
      <div className="medical-grid opacity-40" />
      
      {/* Ambient Glows */}
      <div className="absolute top-[10%] left-[10%] w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-80 h-80 bg-cyan-400/10 blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 bg-white/70 backdrop-blur-2xl rounded-[3rem] border border-slate-200/60 overflow-hidden shadow-2xl relative z-10"
      >
        <div className="scan-line opacity-10" />
        
        {/* Left Panel — Branding */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-blue-50/50 to-slate-50/50 border-r border-slate-200/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
            <img src="/logo.png" className="w-64 h-64 rotate-12 mix-blend-multiply" alt="" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-10">
              <img src="/logo.png" alt="ClinicaDiff" className="w-16 h-16 object-contain drop-shadow-md hover:scale-105 transition-transform duration-300" />
              <p className="text-3xl font-black tracking-tighter text-slate-900 leading-none">
                Clinica<span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Diff</span>
              </p>
            </div>
            
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight mb-8">
              Healthcare <br /> Intelligence <br /> <span className="text-blue-600 font-light">Reimagined.</span>
            </h1>
            
            <div className="space-y-6">
              {[
                { label: 'Neural Diagnostics', icon: Radio },
                { label: 'Biometric Triage', icon: Fingerprint },
                { label: 'Voice AI Copilot', icon: ShieldCheck }
              ].map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  key={item.label} 
                  className="flex items-center gap-4 text-slate-500"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="relative z-10 pt-10">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Medical Operating System v3.0.2</p>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="p-12 lg:p-16 flex flex-col justify-center relative bg-white/40">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-3">Initialize <span className="text-blue-600 font-light">Session</span></h2>
            <p className="text-slate-500 text-sm font-medium">Identify via biometric encrypted credentials.</p>
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
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Bio-Identity (Email)</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  placeholder="name@medical.os"
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white/80 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all font-medium shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-2">Access Cipher (Password)</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  placeholder="••••••••••••"
                  required
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white/80 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all font-medium shadow-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-2 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="w-4 h-4 rounded border border-slate-300 bg-white flex items-center justify-center transition-all group-hover:border-blue-400">
                  <input type="checkbox" className="hidden" />
                  <div className="w-2 h-2 rounded-sm bg-blue-500 opacity-0 transition-opacity" />
                </div>
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest group-hover:text-slate-800 transition-colors">Persistence Mode</span>
              </label>
              <a href="#" className="text-[9px] text-blue-600 hover:text-blue-700 font-bold uppercase tracking-widest transition-colors">Recover ID</a>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg mt-6 text-[10px]"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  Authorize Access
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </motion.button>

            <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-[0.1em] pt-6">
              Awaiting credentials?{' '}
              <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 transition-colors underline underline-offset-4">
                Register New Bio-ID
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
