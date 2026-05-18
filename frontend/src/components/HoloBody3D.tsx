"use client";
import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Organ Map (positions as % of container width/height) ────────────────────
const ORGANS = [
  { id: 'brain',    label: 'Brain',       x: 50,   y: 5.5,  color: '#a78bfa', keywords: ['headache','migraine','seizure','confusion','dizziness','stroke','vertigo','memory','neurological'] },
  { id: 'throat',   label: 'Throat',      x: 50,   y: 11.5, color: '#c084fc', keywords: ['sore throat','tonsil','swallowing','throat','hoarse'] },
  { id: 'lungs',    label: 'Lungs',       x: 35,   y: 20,   color: '#38bdf8', keywords: ['cough','breathing','wheezing','shortness of breath','pneumonia','bronchitis','asthma','chest'] },
  { id: 'heart',    label: 'Heart',       x: 44,   y: 22,   color: '#f43f5e', keywords: ['chest pain','heart','palpitation','angina','cardiac','hypertension'] },
  { id: 'liver',    label: 'Liver',       x: 60,   y: 32,   color: '#fb923c', keywords: ['jaundice','liver','hepatitis','nausea','fatigue'] },
  { id: 'stomach',  label: 'Stomach',     x: 48,   y: 34,   color: '#4ade80', keywords: ['nausea','vomiting','stomach','gastric','indigestion','bloating','heartburn','abdomen'] },
  { id: 'kidneys',  label: 'Kidneys',     x: 62,   y: 40,   color: '#facc15', keywords: ['kidney','urination','back pain','blood in urine','frequent urination','renal'] },
  { id: 'spine',    label: 'Spine',       x: 38,   y: 42,   color: '#94a3b8', keywords: ['back pain','spine','neck','stiff','lumbar','sciatica'] },
  { id: 'intestine',label: 'Intestines',  x: 50,   y: 46,   color: '#34d399', keywords: ['diarrhea','constipation','ibs','cramp','bowel','colon','bloating'] },
  { id: 'knee',     label: 'Knee',        x: 40,   y: 70,   color: '#64748b', keywords: ['knee','joint','arthritis','swelling','ligament'] },
  { id: 'shoulder', label: 'Shoulder',    x: 28,   y: 18,   color: '#7dd3fc', keywords: ['shoulder','arm pain','rotator','frozen shoulder'] },
];

// ─── Neural Particle Canvas ───────────────────────────────────────────────────
function ParticleCanvas({ scanning, activeOrgans }: { scanning: boolean; activeOrgans: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number }[] = [];
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    for (let i = 0; i < (scanning ? 50 : 20); i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        life: Math.random() * 100,
        maxLife: 80 + Math.random() * 120,
        size: 1 + Math.random() * 2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        if (p.life > p.maxLife || p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          particles[i] = { x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, life: 0, maxLife: 80 + Math.random() * 120, size: 1 + Math.random() * 2 };
          return;
        }
        const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * (scanning ? 0.5 : 0.2);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = scanning ? `rgba(34,211,238,${alpha})` : `rgba(167,139,250,${alpha})`;
        ctx.fill();
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [scanning]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }} />;
}

// ─── Scan Line ────────────────────────────────────────────────────────────────
function ScanLine({ scanning }: { scanning: boolean }) {
  if (!scanning) return null;
  return (
    <motion.div
      className="absolute left-0 right-0 pointer-events-none"
      style={{ zIndex: 5, height: 2, background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.8), transparent)' }}
      initial={{ top: '0%' }}
      animate={{ top: ['0%', '100%'] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
    >
      <div className="absolute inset-x-0 -top-8 h-16" style={{ background: 'linear-gradient(to bottom, transparent, rgba(34,211,238,0.06), transparent)' }} />
    </motion.div>
  );
}

// ─── Organ Marker ─────────────────────────────────────────────────────────────
function OrganMarker({ organ, active, emergency, side }: {
  organ: typeof ORGANS[0]; active: boolean; emergency: boolean; side: 'left' | 'right';
}) {
  const [hovered, setHovered] = useState(false);
  const color = emergency && active ? '#f43f5e' : organ.color;
  const show = active || hovered;

  return (
    <div
      className="absolute"
      style={{ left: `${organ.x}%`, top: `${organ.y}%`, transform: 'translate(-50%, -50%)', zIndex: 10 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Outer pulse ring */}
      {show && (
        <motion.div
          className="absolute rounded-full"
          style={{ inset: -8, border: `1.5px solid ${color}`, opacity: 0.3 }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ repeat: Infinity, duration: emergency ? 0.8 : 2, ease: 'easeOut' }}
        />
      )}

      {/* Core dot */}
      <motion.div
        className="relative rounded-full cursor-pointer transition-all duration-300"
        style={{
          width: show ? 14 : 8,
          height: show ? 14 : 8,
          background: show ? color : `${color}40`,
          border: `2px solid ${color}`,
          boxShadow: show ? `0 0 12px 4px ${color}60, 0 0 4px 1px ${color}` : 'none',
        }}
        animate={show ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: Infinity, duration: 1.5 }}
      />

      {/* Callout label */}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, x: side === 'right' ? -8 : 8, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1.5 ${side === 'right' ? 'left-5' : 'right-5'}`}
            style={{ whiteSpace: 'nowrap' }}
          >
            {/* Connector line */}
            <div
              className="h-px w-6 shrink-0"
              style={{ background: `linear-gradient(${side === 'right' ? '90deg' : '270deg'}, ${color}80, transparent)` }}
            />
            {/* Label bubble */}
            <div
              className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: `${color}12`,
                border: `1px solid ${color}40`,
                color: color,
                backdropFilter: 'blur(8px)',
              }}
            >
              {organ.label}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const SYSTEM_TO_ORGANS: Record<string, string[]> = {
  cardiovascular: ['heart'],
  respiratory: ['lungs'],
  neurological: ['brain'],
  psychiatric: ['brain'],
  digestive: ['stomach', 'intestine', 'liver'],
  gastrointestinal: ['stomach', 'intestine', 'liver'],
  hepatobiliary: ['liver'],
  musculoskeletal: ['spine', 'knee', 'shoulder'],
  orthopedic: ['spine', 'knee', 'shoulder'],
  dermatological: ['skin'],
  urological: ['kidneys'],
  renal: ['kidneys'],
  endocrine: ['liver'],
  ent: ['throat'],
  ophthalmic: ['brain'],
};

interface HoloBody3DProps {
  symptoms?: string;
  predictions?: Array<{ disease: string; confidence: number; severity: string; matched_symptoms?: string[]; body_part?: string; body_system?: string }>;
  bodySystems?: string[];
  scanning?: boolean;
  className?: string;
}

export default function HoloBody3D({ symptoms = '', predictions = [], bodySystems = [], scanning = false, className = '' }: HoloBody3DProps) {
  const [activeOrgans, setActiveOrgans] = useState<string[]>([]);
  const emergency = predictions[0]?.severity === 'critical' || predictions[0]?.severity === 'high';
  const topPrediction = predictions[0];

  // Determine which organs to highlight
  useEffect(() => {
    const text = (
      symptoms + ' ' +
      predictions.map(p => p.disease + ' ' + (p.matched_symptoms || []).join(' ')).join(' ')
    ).toLowerCase();
    const fromKeywords = ORGANS.filter(o => o.keywords.some(kw => text.includes(kw))).map(o => o.id);
    const fromSystems = new Set<string>(fromKeywords);
    bodySystems.forEach((sys) => {
      const key = sys.toLowerCase().replace(/\s+/g, '');
      (SYSTEM_TO_ORGANS[key] || SYSTEM_TO_ORGANS[sys.toLowerCase()] || []).forEach((id) => fromSystems.add(id));
    });
    predictions.forEach((p) => {
      const bp = (p.body_part || p.body_system || '').toLowerCase();
      Object.entries(SYSTEM_TO_ORGANS).forEach(([sys, organs]) => {
        if (bp.includes(sys) || sys.includes(bp)) organs.forEach((id) => fromSystems.add(id));
      });
    });
    setActiveOrgans([...fromSystems]);
  }, [symptoms, predictions, bodySystems]);

  // Assign label sides alternately
  const getSide = (organ: typeof ORGANS[0]): 'left' | 'right' => organ.x > 50 ? 'right' : 'left';

  return (
    <div className={`relative flex flex-col ${className}`}>
      {/* Header row */}
      <div className="flex items-start justify-between mb-3 px-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <motion.div
              className="w-2 h-2 rounded-full bg-cyan-400"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <span className="text-[9px] font-bold text-cyan-400/70 uppercase tracking-[0.4em]">Holographic Body Scan</span>
          </div>
          <p className="text-xs text-white/30 font-medium">
            {scanning
              ? 'Neural scan in progress...'
              : activeOrgans.length > 0
                ? `${activeOrgans.length} region${activeOrgans.length > 1 ? 's' : ''} highlighted`
                : 'Awaiting data uplink'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {scanning && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 0.9 }}
              className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-[8px] font-bold text-cyan-400 uppercase tracking-widest"
            >
              Scanning
            </motion.div>
          )}
          {emergency && activeOrgans.length > 0 && (
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 0.7 }}
              className="px-2.5 py-1 bg-rose-500/20 border border-rose-500/40 rounded-full text-[8px] font-bold text-rose-400 uppercase tracking-widest"
            >
              ⚠ Alert
            </motion.div>
          )}
        </div>
      </div>

      {/* Main viewer */}
      <div
        className="relative rounded-[1.5rem] overflow-hidden select-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, #0d1a2e 0%, #060810 100%)',
          border: emergency && activeOrgans.length > 0 ? '1px solid rgba(244,63,94,0.2)' : '1px solid rgba(255,255,255,0.05)',
          minHeight: 480,
        }}
      >
        {/* Corner brackets */}
        {[['top-3 left-3', 'border-l border-t rounded-tl-lg'], ['top-3 right-3', 'border-r border-t rounded-tr-lg'], ['bottom-3 left-3', 'border-l border-b rounded-bl-lg'], ['bottom-3 right-3', 'border-r border-b rounded-br-lg']].map(([pos, style], i) => (
          <div key={i} className={`absolute ${pos} w-5 h-5 border-cyan-500/25 ${style} z-20`} />
        ))}

        {/* Grid */}
        <div className="absolute inset-0 z-0 opacity-40" style={{
          backgroundImage: 'linear-gradient(rgba(34,211,238,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        {/* Ambient glow behind body */}
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <div className="w-48 h-96 rounded-full opacity-20"
            style={{ background: 'radial-gradient(ellipse, rgba(56,189,248,0.3) 0%, transparent 70%)' }} />
        </div>

        {/* Particle layer */}
        <ParticleCanvas scanning={scanning} activeOrgans={activeOrgans} />

        {/* Scan line */}
        <ScanLine scanning={scanning} />

        {/* ── Anatomy Image ── */}
        <div className="relative z-2 flex items-center justify-center h-full py-4" style={{ minHeight: 440 }}>
          <div className="relative" style={{ width: 200, height: 420 }}>
            {/* Body image */}
            <img
              src="/anatomy_body.png"
              alt="Anatomical body"
              className="w-full h-full object-contain"
              style={{
                filter: `
                  brightness(0.85) contrast(1.1)
                  drop-shadow(0 0 20px rgba(56,189,248,0.15))
                  ${activeOrgans.length > 0 ? 'saturate(1.2)' : 'saturate(0.9)'}
                  ${emergency && activeOrgans.length > 0 ? 'drop-shadow(0 0 30px rgba(244,63,94,0.25))' : ''}
                `,
                mixBlendMode: 'screen',
              }}
              draggable={false}
            />

            {/* Holographic tint overlay */}
            <div className="absolute inset-0 rounded-xl pointer-events-none" style={{
              background: scanning
                ? 'linear-gradient(180deg, rgba(34,211,238,0.06) 0%, transparent 50%, rgba(167,139,250,0.04) 100%)'
                : 'linear-gradient(180deg, rgba(56,189,248,0.04) 0%, transparent 60%)',
              mixBlendMode: 'overlay',
            }} />

            {/* Organ markers */}
            {ORGANS.map(organ => (
              <OrganMarker
                key={organ.id}
                organ={organ}
                active={activeOrgans.includes(organ.id)}
                emergency={emergency}
                side={getSide(organ)}
              />
            ))}
          </div>
        </div>

        {/* Bottom hint */}
        <div className="absolute bottom-4 left-0 right-0 text-center z-20">
          <span className="text-[9px] font-bold text-white/12 uppercase tracking-[0.35em]">
            Hover organs · Real-time symptom mapping
          </span>
        </div>
      </div>

      {/* Diagnosis readout */}
      <AnimatePresence>
        {topPrediction && (
          <motion.div
            key="diag"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="mt-3 p-4 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-between gap-4"
          >
            <div>
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-0.5">Primary Detection</p>
              <p className="text-sm font-bold text-white tracking-tight">{topPrediction.disease}</p>
            </div>
            <div className="text-right">
              <p className={`text-xl font-bold tracking-tighter ${emergency ? 'text-rose-400' : 'text-violet-400'}`}>
                {(topPrediction.confidence * 100).toFixed(0)}%
              </p>
              <p className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 ${emergency ? 'text-rose-400/60' : 'text-white/20'}`}>
                {topPrediction.severity}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active organs legend */}
      {activeOrgans.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 flex flex-wrap gap-1.5"
        >
          {activeOrgans.map(oid => {
            const organ = ORGANS.find(o => o.id === oid);
            if (!organ) return null;
            return (
              <span
                key={oid}
                className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider"
                style={{ background: `${organ.color}12`, border: `1px solid ${organ.color}30`, color: organ.color }}
              >
                {organ.label}
              </span>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
