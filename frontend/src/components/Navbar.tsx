"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, User as UserIcon, AlertTriangle, CheckCircle2, Clock, Zap } from 'lucide-react';

interface Notification { id: string; title: string; message: string; type: 'alert' | 'success' | 'info'; timestamp: string; isRead: boolean; }

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const s = localStorage.getItem('user');
    if (s) setUser(JSON.parse(s));
    setNotifications([
      { id: '1', title: 'High Risk Alert', message: 'AI detected critical severity in recent analysis', type: 'alert', timestamp: '2m ago', isRead: false },
      { id: '2', title: 'OCR Complete', message: 'Prescription processed with 99.2% confidence', type: 'success', timestamp: '15m ago', isRead: false },
    ]);
  }, []);

  useEffect(() => { setUnreadCount(notifications.filter(n => !n.isRead).length); }, [notifications]);
  const markAllRead = () => setNotifications(notifications.map(n => ({ ...n, isRead: true })));

  return (
    <header className="fixed top-0 left-72 right-0 h-20 bg-white/60 backdrop-blur-md z-40 px-8 flex items-center justify-between border-b border-slate-200/50 shadow-sm">
      {/* Search */}
      <div className="relative w-96 group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        <input type="text" placeholder="Search patients, records..."
          className="w-full bg-white/80 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 transition-all shadow-sm" />
      </div>

      <div className="flex items-center gap-6">
        {/* Notifications */}
        <div className="relative">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-3 rounded-2xl bg-white border transition-all relative shadow-sm ${showNotifications ? 'border-blue-400' : 'border-slate-200 hover:border-slate-300'}`}>
            <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-blue-600' : 'text-slate-500'}`} />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse border-2 border-white shadow-sm" />}
          </motion.button>
          <AnimatePresence>
            {showNotifications && (
              <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-4 w-80 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl overflow-hidden shadow-2xl z-50">
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Notifications</h3>
                  <button onClick={markAllRead} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest">Mark read</button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className={`px-5 py-4 border-b border-slate-100 flex gap-4 hover:bg-slate-50 transition-colors cursor-pointer ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${n.type === 'alert' ? 'bg-red-50 text-red-500 border border-red-100' : n.type === 'success' ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' : 'bg-blue-50 text-blue-500 border border-blue-100'}`}>
                        {n.type === 'alert' ? <AlertTriangle className="w-5 h-5" /> : n.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1.5 uppercase tracking-widest"><Clock className="w-3 h-3" />{n.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800">{user?.name || 'User'}</p>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">{user?.role || 'guest'}</p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 p-[2px] cursor-pointer shadow-md shadow-blue-500/20">
            <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
