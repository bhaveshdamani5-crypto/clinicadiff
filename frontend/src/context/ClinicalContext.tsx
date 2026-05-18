"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ClinicalSnapshot = {
  symptoms: string;
  predictions: any[];
  bodySystems: string[];
  medications: any[];
  source: string;
};

const defaultSnapshot: ClinicalSnapshot = {
  symptoms: '',
  predictions: [],
  bodySystems: [],
  medications: [],
  source: '',
};

type ClinicalContextType = {
  snapshot: ClinicalSnapshot;
  updateSnapshot: (partial: Partial<ClinicalSnapshot>) => void;
  clearSnapshot: () => void;
};

const ClinicalContext = createContext<ClinicalContextType | null>(null);

export function ClinicalProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<ClinicalSnapshot>(defaultSnapshot);

  const updateSnapshot = useCallback((partial: Partial<ClinicalSnapshot>) => {
    setSnapshot((prev) => {
      const predictions = partial.predictions ?? prev.predictions;
      const bodySystems = [
        ...new Set([
          ...(partial.bodySystems ?? prev.bodySystems),
          ...predictions.map((p) => p.body_part || p.body_system).filter(Boolean),
        ]),
      ];
      return { ...prev, ...partial, bodySystems, predictions };
    });
  }, []);

  const clearSnapshot = useCallback(() => setSnapshot(defaultSnapshot), []);

  return (
    <ClinicalContext.Provider value={{ snapshot, updateSnapshot, clearSnapshot }}>
      {children}
    </ClinicalContext.Provider>
  );
}

export function useClinical() {
  const ctx = useContext(ClinicalContext);
  if (!ctx) throw new Error('useClinical must be used within ClinicalProvider');
  return ctx;
}
