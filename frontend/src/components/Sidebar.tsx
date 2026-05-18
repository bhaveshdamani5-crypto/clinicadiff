"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, LogOut } from 'lucide-react';

interface SidebarProps { role: 'doctor' | 'patient'; }

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const doctorLinks = [
    { name: 'Command Center', href: '/dashboard/doctor', icon: LayoutDashboard },
  ];

  const patientLinks = [
    { name: 'Health Hub', href: '/dashboard/patient', icon: LayoutDashboard },
  ];

  const links = role === 'doctor' ? doctorLinks : patientLinks;
  const handleLogout = () => { localStorage.clear(); window.location.href = '/auth/login'; };

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-white/70 backdrop-blur-xl z-50 flex flex-col p-6 overflow-hidden border-r border-slate-200/60 shadow-lg shadow-blue-500/5">
      {/* Ambient glow */}
      <div className="absolute -top-20 -left-20 w-60 h-60 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 -left-10 w-40 h-40 bg-cyan-400/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="mb-12 flex flex-col items-center text-center relative z-10">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="w-20 h-20 rounded-3xl overflow-hidden shadow-lg shadow-blue-500/10 border border-slate-200 mb-4 bg-white flex justify-center items-center"
        >
          <img src="/logo.png" alt="Clinica.Diff" className="w-12 h-12 object-contain mix-blend-multiply" />
        </motion.div>
        <p className="text-[9px] font-bold text-blue-600 uppercase tracking-[0.4em] ml-1">Clinical Intelligence</p>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1 relative z-10">
        <p className="text-[9px] font-bold text-slate-400 mb-4 ml-4 uppercase tracking-[0.2em]">Navigation</p>
        {links.map((link, i) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.name} href={link.href}>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ x: 4 }}
                className={`relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-200/50 border border-transparent'
                }`}
              >
                {isActive && (
                  <motion.div layoutId="sidebar-glow" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                )}
                <link.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-600' : 'group-hover:text-blue-500'}`} />
                <span className="text-sm font-semibold">{link.name}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Status + Logout */}
      <div className="space-y-4 pt-6 border-t border-slate-200/50 relative z-10">
        <div className="bg-white/60 backdrop-blur p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse relative shadow-[0_0_8px_rgba(16,185,129,0.5)]">
              <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-40" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">All Systems Online</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full" />
          </div>
        </div>

        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl text-slate-500 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all duration-300 group shadow-sm font-bold uppercase tracking-widest text-[10px]">
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
