"use client";
import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { 
  ShieldCheck, 
  ArrowRight, 
  Brain, 
  Zap, 
  HeartPulse,
  Lock,
  Dna,
  Network,
  Sparkles,
  Scan,
  Fingerprint,
  TrendingUp,
  Activity,
  Pill,
  Syringe,
  Stethoscope
} from 'lucide-react';
import Link from 'next/link';
import DnaHelix from '../components/DnaHelix';
import AdvancedParticles from '../components/AdvancedParticles';

// Floating medical icon component
function FloatingIcon({ icon: Icon, className, delay = 0 }: { icon: any; className: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      animate={{ 
        y: [0, -15, 0],
        rotate: [0, 5, -5, 0],
        opacity: [0.08, 0.15, 0.08]
      }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay }}
    >
      <Icon className="w-full h-full text-blue-400/20" strokeWidth={1} />
    </motion.div>
  );
}

// Animated pulse line
function PulseLine({ className }: { className: string }) {
  return (
    <div className={`absolute overflow-hidden pointer-events-none ${className}`}>
      <motion.div 
        className="h-[1px] w-full"
        style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.3), rgba(34,211,238,0.3), transparent)" }}
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

export default function Home() {
  const { scrollY } = useScroll();

  // Staggered hero fade-outs
  const badgeOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  const badgeY = useTransform(scrollY, [0, 200], [0, -40]);

  const titleOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const titleY = useTransform(scrollY, [0, 400], [0, -80]);
  const titleScale = useTransform(scrollY, [0, 400], [1, 0.92]);

  const subOpacity = useTransform(scrollY, [50, 350], [1, 0]);
  const subY = useTransform(scrollY, [50, 350], [0, -50]);

  const ctaOpacity = useTransform(scrollY, [100, 450], [1, 0]);
  const ctaY = useTransform(scrollY, [100, 450], [0, -40]);

  const statsOpacity = useTransform(scrollY, [200, 550], [1, 0]);
  const statsY = useTransform(scrollY, [200, 550], [0, -30]);

  // 3D tilt for title on mouse move
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [8, -8]), { stiffness: 100, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-500, 500], [-8, 8]), { stiffness: 100, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  // Stats counters
  const [counts, setCounts] = useState({ patients: 0, accuracy: 0, diseases: 0 });
  useEffect(() => {
    const interval = setInterval(() => {
      setCounts(prev => ({
        patients: prev.patients < 12500 ? prev.patients + 125 : 12500,
        accuracy: prev.accuracy < 99 ? prev.accuracy + 1 : 99,
        diseases: prev.diseases < 60 ? prev.diseases + 1 : 60,
      }));
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Letter animation for title
  const titleLetters = "ClinicaDiff".split("");

  return (
    <main className="min-h-screen bg-transparent text-slate-900 relative overflow-hidden">
      {/* Background layers */}
      <div className="medical-bg" />
      <div className="medical-grid opacity-40" />
      <div className="scan-line" />

      {/* Floating medical icons scattered across hero */}
      <FloatingIcon icon={Stethoscope} className="top-[12%] left-[8%] w-20 h-20" delay={0} />
      <FloatingIcon icon={HeartPulse} className="top-[25%] right-[12%] w-16 h-16" delay={1} />
      <FloatingIcon icon={Pill} className="bottom-[30%] left-[15%] w-14 h-14" delay={2} />
      <FloatingIcon icon={Activity} className="top-[60%] right-[8%] w-18 h-18" delay={3} />
      <FloatingIcon icon={Syringe} className="bottom-[15%] right-[20%] w-12 h-12" delay={1.5} />

      {/* Pulse lines */}
      <PulseLine className="top-[30%] left-0 right-0" />
      <PulseLine className="top-[70%] left-0 right-0" />

      {/* Advanced 3D Particle Constellation Background */}
      <AdvancedParticles />

      {/* 3D DNA Helix — full-page right side */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[1]">
        <div className="absolute top-0 bottom-0 right-[-2%] w-[35vw] opacity-45">
          <DnaHelix />
        </div>
      </div>

      {/* ============ HERO SECTION ============ */}
      <section 
        className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-6 z-10"
        onMouseMove={handleMouseMove}
      >
        {/* Badge */}
        <motion.div style={{ opacity: badgeOpacity, y: badgeY }} className="relative z-10 mb-12">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full glass border border-slate-200/60 shadow-sm"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
              <Sparkles className="w-4 h-4 text-blue-500" />
            </motion.div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Next Gen Medical Intelligence</span>
          </motion.div>
        </motion.div>

        {/* 3D Animated Title */}
        <motion.div
          style={{ opacity: titleOpacity, y: titleY, scale: titleScale, rotateX, rotateY, perspective: 1000 }}
          className="relative z-10 text-center mb-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
            className="relative"
          >
            {/* Abstract Premium Glow instead of a static logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                className="w-[400px] h-[200px] bg-blue-500/20 blur-[100px] rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute w-[200px] h-[200px] bg-cyan-400/20 blur-[80px] rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
            </div>

            {/* Animated letter-by-letter title */}
            <h1 className="relative z-10 flex items-center justify-center flex-wrap">
              {titleLetters.map((letter, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 50, rotateX: -90 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ duration: 0.6, delay: 0.05 * i, ease: "easeOut" }}
                  className={`text-[14vw] lg:text-[9rem] font-black tracking-tighter leading-[0.85] inline-block ${
                    i >= 7
                      ? "bg-gradient-to-br from-blue-500 via-blue-400 to-cyan-500 bg-clip-text text-transparent"
                      : "text-slate-900"
                  }`}
                  style={{
                    textShadow: i < 7 
                      ? "0 4px 8px rgba(15,23,42,0.08), 0 1px 0 rgba(15,23,42,0.04)" 
                      : "none",
                    transformStyle: "preserve-3d",
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </h1>

            {/* Subtle underline glow */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
              className="mt-4 mx-auto h-[2px] w-48 bg-gradient-to-r from-transparent via-blue-400/60 to-transparent"
            />
          </motion.div>
        </motion.div>

        {/* Subtitle */}
        <motion.div style={{ opacity: subOpacity, y: subY }} className="relative z-10 text-center max-w-3xl mx-auto">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-slate-500 text-lg md:text-xl font-medium mb-14 leading-relaxed"
          >
            Architecting the future of healthcare with{" "}
            <span className="text-slate-800 font-bold">Neural Intelligence</span>.{" "}
            Real-time diagnostics, drug interaction analysis, and community outbreak detection — all in one platform.
          </motion.p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div style={{ opacity: ctaOpacity, y: ctaY }} className="relative z-10 mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-5 justify-center"
          >
            <Link href="/auth/register">
              <motion.button 
                whileHover={{ scale: 1.06, boxShadow: "0 0 50px rgba(59, 130, 246, 0.35)" }}
                whileTap={{ scale: 0.95 }}
                className="px-14 py-5 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-2xl text-sm font-bold uppercase tracking-[0.15em] flex items-center gap-4 text-white group relative overflow-hidden shadow-xl shadow-blue-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative z-10">Get Started</span>
                <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            <Link href="/auth/login">
              <motion.button 
                whileHover={{ scale: 1.06, borderColor: "rgba(59, 130, 246, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                className="px-14 py-5 bg-white/60 backdrop-blur-xl border border-slate-200 rounded-2xl text-sm font-bold uppercase tracking-[0.15em] text-slate-700 shadow-sm hover:shadow-md transition-all"
              >
                Sign In
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats Strip */}
        <motion.div style={{ opacity: statsOpacity, y: statsY }} className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="flex flex-wrap justify-center gap-6 md:gap-12"
          >
            {[
              { label: "Patients Analyzed", value: counts.patients.toLocaleString() + "+", icon: HeartPulse, color: "text-rose-500" },
              { label: "Diagnostic Accuracy", value: counts.accuracy + ".7%", icon: TrendingUp, color: "text-emerald-500" },
              { label: "Diseases Covered", value: counts.diseases + "+", icon: Scan, color: "text-blue-500" },
            ].map((stat) => (
              <motion.div 
                key={stat.label}
                whileHover={{ y: -4, scale: 1.04 }}
                className="text-center bg-white/50 backdrop-blur-lg px-8 py-5 rounded-2xl border border-slate-100 shadow-sm"
              >
                <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
                <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ============ FEATURES SECTION ============ */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              className="mx-auto mb-6 h-[2px] w-16 bg-gradient-to-r from-blue-500 to-cyan-500"
            />
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
              Enterprise Medical Intelligence
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              Harness the power of multi-advanced neural models. Seamlessly infer diseases, detect localized outbreaks, and analyze complex genomic data.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Neural Vision OCR", desc: "Instantly transcribe messy handwritten prescriptions into structured, analyzable data.", icon: Zap, color: "text-blue-600", bg: "bg-blue-50", border: "hover:border-blue-300" },
              { title: "Bio-Sync Inference", desc: "Predict probable medical conditions based on multi-symptom analysis and prescription history.", icon: Brain, color: "text-indigo-600", bg: "bg-indigo-50", border: "hover:border-indigo-300" },
              { title: "Drug Interaction Check", desc: "Real-time DDI validation to prevent adverse reactions and safeguard patient health.", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50", border: "hover:border-emerald-300" },
              { title: "Hereditary Risk Engine", desc: "Calculate long-term genetic risks by analyzing patient family history and treatment data.", icon: Dna, color: "text-cyan-600", bg: "bg-cyan-50", border: "hover:border-cyan-300" },
              { title: "Outbreak Detection", desc: "Cluster analysis of real-time regional symptom data to detect localized viral outbreaks.", icon: Network, color: "text-orange-600", bg: "bg-orange-50", border: "hover:border-orange-300" },
              { title: "Biometric Trust", desc: "Cryptographic validation of health records ensuring data is decentralized and tamper-proof.", icon: Fingerprint, color: "text-purple-600", bg: "bg-purple-50", border: "hover:border-purple-300" },
            ].map((feature, i) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
                whileHover={{ y: -10, rotateX: 3, rotateY: -3 }}
                className={`bg-white/70 backdrop-blur-xl p-10 rounded-3xl border border-slate-200/60 ${feature.border} relative group cursor-default shadow-md hover:shadow-xl transition-all duration-500`}
                style={{ transformStyle: "preserve-3d" }}
              >
                <motion.div 
                  className={`w-14 h-14 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-8`}
                  whileHover={{ scale: 1.15, rotate: 8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <feature.icon className="w-7 h-7" />
                </motion.div>
                <h3 className="text-lg font-black text-slate-900 mb-3 tracking-tight uppercase">{feature.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed text-sm">{feature.desc}</p>
                <motion.div 
                  className="absolute bottom-0 left-8 right-8 h-[2px] rounded-full bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                  initial={{ opacity: 0, scaleX: 0 }}
                  whileHover={{ opacity: 0.5, scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="py-16 border-t border-slate-200/60 relative z-10 px-6 bg-white/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="" className="w-7 h-7 object-contain mix-blend-multiply opacity-60" />
            <div>
              <p className="text-base font-black tracking-tighter text-slate-900">
                Clinica<span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">Diff</span>
              </p>
              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-[0.2em]">Medical Intelligence Platform</p>
            </div>
          </div>
          <div className="flex gap-8">
            {['Privacy', 'Security', 'Terms'].map(item => (
              <a key={item} href="#" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">{item}</a>
            ))}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">© 2026 ClinicaDiff</p>
        </div>
      </footer>
    </main>
  );
}
