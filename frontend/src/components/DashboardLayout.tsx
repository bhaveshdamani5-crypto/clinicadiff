"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<'doctor' | 'patient' | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token || !user) { router.push('/auth/login'); return; }
    setRole(JSON.parse(user).role);
  }, [router]);

  if (!role) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative">
      <div className="medical-bg opacity-30" />
      <div className="medical-grid opacity-20" />
      <Sidebar role={role} />
      <Navbar />
      <main className="pl-72 pt-20 min-h-screen relative z-10">
        <AnimatePresence mode="wait">
          <motion.div key="content" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: "easeOut" }} className="p-8">
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
