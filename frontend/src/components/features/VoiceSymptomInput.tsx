"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Loader2, Brain, Square } from 'lucide-react';

interface VoiceSymptomInputProps {
  value: string;
  onChange: (text: string) => void;
}

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: { results: { length: number; [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
};

export default function VoiceSymptomInput({ value, onChange }: VoiceSymptomInputProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const listeningRef = useRef(false);
  const onChangeRef = useRef(onChange);

  onChangeRef.current = onChange;

  const stopRecognition = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec || !listeningRef.current) return;
    listeningRef.current = false;
    try {
      rec.stop();
    } catch {
      /* already stopped */
    }
    setListening(false);
  }, []);

  const startRecognition = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec || listeningRef.current) return;

    try {
      rec.start();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'InvalidStateError') {
        try {
          rec.stop();
        } catch {
          /* ignore */
        }
        window.setTimeout(() => {
          if (listeningRef.current) return;
          try {
            rec.start();
          } catch {
            listeningRef.current = false;
            setListening(false);
          }
        }, 200);
        return;
      }
      listeningRef.current = false;
      setListening(false);
    }
  }, []);

  useEffect(() => {
    const win = window as typeof window & {
      SpeechRecognition?: new () => BrowserSpeechRecognition;
      webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
    };
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SR) {
      setSupported(false);
      return;
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-IN';

    rec.onstart = () => {
      listeningRef.current = true;
      setListening(true);
    };

    rec.onend = () => {
      listeningRef.current = false;
      setListening(false);
    };

    rec.onerror = (event: { error: string }) => {
      if (event.error === 'aborted' || event.error === 'no-speech') {
        listeningRef.current = false;
        setListening(false);
        return;
      }
      listeningRef.current = false;
      setListening(false);
    };

    rec.onresult = (event: { results: { length: number; [i: number]: { [j: number]: { transcript: string } } } }) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      onChangeRef.current(transcript.trim());
    };

    recognitionRef.current = rec;

    return () => {
      listeningRef.current = false;
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    };
  }, []);

  const toggle = () => {
    if (!recognitionRef.current) return;
    if (listeningRef.current) {
      stopRecognition();
    } else {
      startRecognition();
    }
  };

  if (!supported) {
    return (
      <p className="text-xs text-amber-600 font-medium text-center">
        Voice input works best in Chrome or Edge. Type your symptoms below.
      </p>
    );
  }

  return (
    <motion.div className="flex flex-col items-center gap-3">
      <motion.button
        type="button"
        onClick={toggle}
        aria-pressed={listening}
        aria-label={listening ? 'Stop voice input' : 'Start voice input with brain assist'}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center border-2 shadow-lg transition-all overflow-hidden ${
          listening
            ? 'bg-red-500 border-red-400 text-white shadow-red-500/40'
            : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 text-blue-600 shadow-blue-500/20 hover:border-blue-400'
        }`}
      >
        {listening && (
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-white/40"
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        <span className="relative z-10 flex items-center justify-center w-full h-full">
          <AnimatePresence mode="wait" initial={false}>
            {listening ? (
              <motion.span
                key="listening"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="flex items-center justify-center"
              >
                <Mic className="w-9 h-9 shrink-0" strokeWidth={2.25} />
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="flex items-center justify-center"
              >
                <Brain className="w-9 h-9 shrink-0" strokeWidth={2} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </motion.button>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 min-h-[1rem]">
        {listening ? (
          <span className="flex items-center justify-center gap-2 text-red-500">
            <Square className="w-3 h-3 fill-current" />
            Listening — tap to stop
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Mic className="w-3 h-3 text-blue-500" />
            Tap brain to speak symptoms
          </span>
        )}
      </p>
      {value && !listening && (
        <p className="text-[9px] text-slate-400 font-medium max-w-xs text-center line-clamp-2">
          Voice captured — edit text below if needed
        </p>
      )}
    </motion.div>
  );
};
