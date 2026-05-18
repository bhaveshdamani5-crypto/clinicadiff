"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Stethoscope, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { API_BASE } from '@/lib/api';

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
];

interface AppointmentBookingProps {
  doctors: any[];
  selectedDoctor: string;
  onSelectDoctor: (id: string) => void;
  specialization: string;
  onSpecializationChange: (s: string) => void;
}

export default function AppointmentBooking({
  doctors,
  selectedDoctor,
  onSelectDoctor,
  specialization,
  onSpecializationChange,
}: AppointmentBookingProps) {
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};

  const loadAppointments = async () => {
    if (!user.id) return;
    const res = await fetch(`${API_BASE}/api/appointments/patient/${user.id}`);
    const data = await res.json();
    if (res.ok) setAppointments(data);
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const book = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) {
      alert('Please select a doctor');
      return;
    }
    if (!date || !timeSlot || !reason.trim()) {
      alert('Please fill date, time, and reason');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: user.id,
          doctorId: selectedDoctor,
          appointmentDate: date,
          timeSlot,
          reason: reason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Booking failed');
      setReason('');
      setTimeSlot('');
      loadAppointments();
      alert('Appointment request sent! Your doctor will confirm soon.');
    } catch (err: any) {
      alert(err.message || 'Could not book appointment');
    } finally {
      setLoading(false);
    }
  };

  const statusStyle = (s: string) => {
    if (s === 'confirmed') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (s === 'cancelled') return 'bg-red-50 text-red-600 border-red-100';
    if (s === 'completed') return 'bg-slate-50 text-slate-600 border-slate-200';
    return 'bg-amber-50 text-amber-700 border-amber-100';
  };

  return (
    <motion.div className="space-y-10">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-8 rounded-[2.5rem]">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-white border border-blue-100 flex items-center justify-center shadow-sm">
            <Calendar className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900">Book Appointment</h3>
            <p className="text-sm text-slate-500 font-medium">Schedule a visit with your assigned doctor</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <form onSubmit={book} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Select Doctor</label>
            <select value={specialization} onChange={(e) => onSpecializationChange(e.target.value)}
              className="w-full mb-3 px-4 py-3 rounded-2xl border border-slate-200 text-sm">
              <option value="">All specializations</option>
              {['General Physician', 'Cardiologist', 'Dermatologist', 'Neurologist', 'Pediatrician', 'Gastroenterologist'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {doctors.map((doc) => (
                <button key={doc._id} type="button" onClick={() => onSelectDoctor(doc._id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedDoctor === doc._id ? 'bg-blue-50 border-blue-200' : 'border-slate-100 hover:border-slate-200'}`}>
                  <p className="font-black text-slate-900">Dr. {doc.name}</p>
                  <p className="text-xs text-slate-500">{doc.specialization || 'General'}{doc.hospital ? ` · ${doc.hospital}` : ''}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Date</label>
            <input type="date" required value={date} min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm" />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Time Slot</label>
            <motion.div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((slot) => (
                <button key={slot} type="button" onClick={() => setTimeSlot(slot)}
                  className={`py-2 px-2 rounded-xl text-[10px] font-bold border ${timeSlot === slot ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:border-blue-200'}`}>
                  {slot}
                </button>
              ))}
            </motion.div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Reason for visit</label>
            <textarea required value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why you need to see the doctor…"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm h-28 resize-none" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl text-xs disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Stethoscope className="w-5 h-5" />}
            Request Appointment
          </button>
        </form>

        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
          <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" /> Your Appointments
          </h4>
          {appointments.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No appointments booked yet</p>
          ) : (
            <div className="space-y-4 max-h-[480px] overflow-y-auto">
              {appointments.map((a) => (
                <div key={a._id} className="p-5 border border-slate-100 rounded-2xl hover:border-blue-100 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-black text-slate-900">Dr. {a.doctorId?.name || 'Doctor'}</p>
                    <span className={`px-3 py-1 rounded-xl text-[9px] font-bold uppercase border ${statusStyle(a.status)}`}>{a.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{a.doctorId?.specialization}</p>
                  <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    {new Date(a.appointmentDate).toLocaleDateString()} · {a.timeSlot}
                  </p>
                  <p className="text-sm text-slate-600 mt-2">{a.reason}</p>
                  {a.status === 'confirmed' && <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-2" />}
                  {a.status === 'cancelled' && <XCircle className="w-4 h-4 text-red-400 mt-2" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
