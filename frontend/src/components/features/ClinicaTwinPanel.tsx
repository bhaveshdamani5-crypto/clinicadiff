"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, RefreshCw } from 'lucide-react';
import HoloBody3D from '@/components/HoloBody3D';
import { useClinical } from '@/context/ClinicalContext';

export default function ClinicaTwinPanel() {
  const { snapshot } = useClinical();
  const [scanning, setScanning] = useState(false);

  const runScan = () => {
    setScanning(true);
    setTimeout(() => setScanning(false), 3000);
  };

  return (
    <motion.div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center">
            <User className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Clinica Twin</h3>
            <p className="text-sm text-slate-500 font-medium">Digital health avatar — organs light up from your AI results</p>
          </div>
        </div>
        <button type="button" onClick={runScan}
          className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-cyan-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
          <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
          Rescan
        </button>
      </div>

      {!snapshot.predictions.length && !snapshot.symptoms && (
        <div className="p-8 bg-slate-100 border border-slate-200 rounded-[2rem] text-center">
          <p className="text-sm text-slate-500 font-medium">Run Symptom Analyzer, Multimodal Diagnosis, or Prescription AI first — your twin will map affected body regions automatically.</p>
        </div>
      )}

      <HoloBody3D
        symptoms={snapshot.symptoms}
        predictions={snapshot.predictions}
        bodySystems={snapshot.bodySystems}
        scanning={scanning}
        className="w-full"
      />

      {snapshot.source && (
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
          Data source: {snapshot.source.replace('_', ' ')}
        </p>
      )}
    </motion.div>
  );
}
