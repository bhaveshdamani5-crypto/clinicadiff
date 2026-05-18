"use client";
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Scan, Camera, Loader2, Pill, X } from 'lucide-react';
import { apiPost, fileToBase64, getStoredUser } from '@/lib/api';

export default function MedicineScanner({ selectedDoctor }: { selectedDoctor?: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scan = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const image = await fileToBase64(file);
      const user = getStoredUser();
      const { data, ok } = await apiPost<any>('/api/ai/scan-medicine', {
        image,
        doctorId: selectedDoctor,
        patientId: user.id,
        patientName: user.name,
      });
      if (!ok) {
        alert((data as any).error || 'Scan failed');
        return;
      }
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="space-y-8">
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-8 rounded-[2.5rem]">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center shadow-sm">
            <Scan className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">AR Medicine Scanner</h3>
            <p className="text-sm text-slate-500 font-medium">Point camera at medicine strip, box, or label</p>
          </div>
        </div>
        <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
          }} />
        {!preview ? (
          <button type="button" onClick={() => inputRef.current?.click()}
            className="w-full p-12 border-2 border-dashed border-emerald-200 rounded-[2rem] bg-white hover:border-emerald-400 flex flex-col items-center gap-4 transition-all">
            <Camera className="w-12 h-12 text-emerald-500" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-600">Scan Medicine</span>
          </button>
        ) : (
          <div className="relative flex justify-center">
            <img src={preview} alt="Medicine" className="max-h-56 rounded-2xl border shadow-lg" />
            <button type="button" onClick={() => { setPreview(null); setFile(null); setResult(null); }}
              className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <button type="button" onClick={scan} disabled={!file || loading}
          className="w-full mt-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black uppercase tracking-widest text-xs rounded-[2rem] disabled:opacity-50 flex items-center justify-center gap-3">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Pill className="w-5 h-5" />}
          Identify Medicine
        </button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2">Identified</p>
            <h4 className="text-2xl font-black text-slate-900">{result.medicine_name || 'Unknown'}</h4>
            <p className="text-sm text-slate-500 mt-1">{result.generic_name} · {result.strength} · {result.form}</p>
            {result.likely_used_for?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {result.likely_used_for.map((c: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px] font-bold text-emerald-700">{c}</span>
                ))}
              </div>
            )}
          </div>
          {result.layman_guide && (
            <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-[2rem] space-y-4">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Simple Guide</p>
              <p className="text-sm text-slate-700 font-medium">{result.layman_guide.what_is_this_medicine}</p>
              {result.layman_guide.how_to_take?.map((s: string, i: number) => (
                <p key={i} className="text-sm text-slate-600 flex gap-2"><span className="font-black text-emerald-600">{i + 1}.</span>{s}</p>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
