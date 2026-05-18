"use client";
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Loader2, AlertTriangle, Eye, X } from 'lucide-react';
import { apiPost, fileToBase64, getStoredUser } from '@/lib/api';
import { useClinical } from '@/context/ClinicalContext';

export default function MultimodalDiagnosis({
  selectedDoctor,
  patientAge,
}: {
  selectedDoctor: string;
  patientAge: string;
}) {
  const { updateSnapshot } = useClinical();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const user = getStoredUser();
      const image = await fileToBase64(file);
      const { data, ok } = await apiPost<any>('/api/ai/multimodal-diagnose', {
        image,
        symptoms,
        age: patientAge || undefined,
        doctorId: selectedDoctor,
        patientId: user.id,
        patientName: user.name,
      });
      if (!ok) {
        alert((data as any).error || (data as any).message || 'Analysis failed');
        return;
      }
      setResult(data);
      updateSnapshot({
        symptoms: symptoms + ' ' + (data.visual_findings || []).join(' '),
        predictions: data.predictions || [],
        source: 'multimodal',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="space-y-8">
      <motion.div className="bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-100 p-8 rounded-[2.5rem]">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-white border border-violet-100 flex items-center justify-center shadow-sm">
            <Camera className="w-7 h-7 text-violet-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Multimodal Diagnosis</h3>
            <p className="text-sm text-slate-500 font-medium">Photo + symptoms — rash, wound, swelling, eye, skin</p>
          </div>
        </div>
        <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
          }} />
        {!preview ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button type="button" onClick={() => inputRef.current?.click()}
              className="p-10 border-2 border-dashed border-violet-200 rounded-[2rem] bg-white hover:border-violet-400 transition-all flex flex-col items-center gap-3">
              <Upload className="w-10 h-10 text-violet-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Upload Image</span>
            </button>
            <button type="button" onClick={() => { inputRef.current?.setAttribute('capture', 'environment'); inputRef.current?.click(); }}
              className="p-10 border-2 border-dashed border-blue-200 rounded-[2rem] bg-white hover:border-blue-400 transition-all flex flex-col items-center gap-3">
              <Camera className="w-10 h-10 text-blue-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Take Photo</span>
            </button>
          </div>
        ) : (
          <div className="relative inline-block">
            <img src={preview} alt="Clinical" className="max-h-64 rounded-[2rem] border border-slate-200 shadow-lg" />
            <button type="button" onClick={() => { setPreview(null); setFile(null); }}
              className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)}
          placeholder="Describe what you see and feel — e.g. red itchy rash on arm for 2 days, spreading..."
          className="w-full mt-6 bg-white border border-slate-200 rounded-[2rem] p-6 text-slate-800 font-medium resize-none h-28 focus:outline-none focus:border-violet-400" />
        <motion.button type="button" onClick={analyze} disabled={!file || loading}
          className="w-full mt-6 py-5 bg-gradient-to-r from-violet-600 to-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-[2rem] disabled:opacity-50 flex items-center justify-center gap-3">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
          Analyze Image + Symptoms
        </motion.button>
      </motion.div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {result.emergency_now && (
            <div className="p-5 bg-red-50 border border-red-200 rounded-2xl flex gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
              <p className="text-sm font-bold text-red-800">Seek emergency care if symptoms worsen rapidly.</p>
            </div>
          )}
          {result.visual_findings?.length > 0 && (
            <div className="p-6 bg-white border border-slate-200 rounded-[2rem]">
              <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest mb-3">Visual Findings</p>
              <ul className="space-y-2">
                {result.visual_findings.map((v: string, i: number) => (
                  <li key={i} className="text-sm text-slate-700 font-medium flex gap-2"><span>•</span>{v}</li>
                ))}
              </ul>
            </div>
          )}
          {result.clinical_summary && (
            <p className="text-base text-slate-700 font-medium leading-relaxed px-2">{result.clinical_summary}</p>
          )}
          {result.predictions?.map((p: any, i: number) => (
            <div key={i} className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
              <div className="flex justify-between mb-2">
                <h4 className="font-black text-slate-900">{p.disease}</h4>
                <span className="text-blue-600 font-black">{(p.confidence * 100).toFixed(0)}%</span>
              </div>
              <p className="text-sm text-slate-600">{p.layman_explanation}</p>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
