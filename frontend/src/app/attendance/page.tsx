"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import apiClient from '@/lib/api-client';
import { 
  ChevronLeft, ChevronRight, Save, Utensils, 
  Calendar, CheckCircle, XCircle 
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AttendancePage() {
  const { user } = useAuth();
  const [date, setDate] = useState(new Date());
  const [members, setMembers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [date, user]);

  const fetchData = async () => {
    if (!user?.pgId) return;
    setLoading(true);
    try {
      const [memRes, attRes] = await Promise.all([
        apiClient.get('/api/pg/members'),
        apiClient.get(`/api/attendance?month=${date.toISOString()}`)
      ]);
      setMembers(memRes.data);
      const dayAtt = attRes.data.find((a: any) => new Date(a.date).toDateString() === date.toDateString());
      
      if (dayAtt) {
        setAttendance(dayAtt.records || []);
      } else if (user?.role === 'MANAGER') {
        const defaultAtt: any[] = [];
        const mealTypes = (user?.pgId?.mealTypes || ['breakfast', 'lunch', 'dinner']);
        memRes.data.forEach((m: any) => {
          mealTypes.forEach((meal: string) => {
            defaultAtt.push({ userId: m._id, mealType: meal, status: true });
          });
        });
        setAttendance(defaultAtt);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const toggleAttendance = (userId: string, mealType: string) => {
    const existing = attendance.find(a => a.userId === userId && a.mealType === mealType);
    if (existing) {
      setAttendance(attendance.map(a => 
        (a.userId === userId && a.mealType === mealType) ? { ...a, status: !a.status } : a
      ));
    } else {
      setAttendance([...attendance, { userId, mealType, status: true }]);
    }
  };

  const handleSave = async () => {
    try {
      await apiClient.post('/api/attendance', {
        date: date.toISOString(),
        records: attendance
      });
      alert('Attendance saved successfully!');
    } catch (error) { alert('Error saving attendance'); }
  };

  if (!user || user.role !== 'MANAGER') {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <XCircle className="text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-black uppercase italic italic tracking-tighter">Access Reserved</h2>
        <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-2">Internal Management Only</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header & Date Selector */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">Attendance</h1>
          <p className="text-neutral-500 font-bold text-xs uppercase tracking-widest">Daily Meal Registry</p>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-4 bg-black/40 p-2 rounded-2xl border border-white/5">
            <Button variant="ghost" size="sm" className="p-2 h-auto" onClick={() => setDate(new Date(date.getTime() - 86400000))}>
              <ChevronLeft size={20} />
            </Button>
            <div className="min-w-[140px] text-center flex items-center justify-center gap-2">
               <Calendar size={14} className="text-primary" />
               <p className="text-sm font-black uppercase tracking-widest italic">{date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</p>
            </div>
            <Button variant="ghost" size="sm" className="p-2 h-auto" onClick={() => setDate(new Date(date.getTime() + 86400000))}>
              <ChevronRight size={20} />
            </Button>
          </div>
          <Button onClick={handleSave} className="gap-2">
            <Save size={18} /> Save
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="p-20 text-center text-primary font-black uppercase tracking-widest animate-pulse">Syncing Roster...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map(member => (
            <Card key={member._id} className="relative group overflow-hidden">
               <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-xs font-black text-primary border border-white/5">
                    {member.name.substring(0,2).toUpperCase()}
                  </div>
                  <h4 className="font-black text-sm uppercase italic tracking-tighter">{member.name}</h4>
               </div>
               
               <div className="grid grid-cols-1 gap-2">
                  {(user?.pgId?.mealTypes || ['breakfast', 'lunch', 'dinner']).map((meal: string) => {
                    const record = attendance.find(a => a.userId === member._id && a.mealType === meal);
                    const suggested = record?.memberProposedStatus;
                    
                    return (
                      <button
                        key={meal}
                        onClick={() => toggleAttendance(member._id, meal)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          record?.status 
                            ? 'bg-primary/10 border-primary/40 text-primary' 
                            : 'bg-black/40 border-white/5 text-neutral-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                           <Utensils size={14} />
                           <div>
                             <span className="text-xs font-black uppercase tracking-widest block leading-none">{meal}</span>
                             {suggested !== undefined && (
                               <span className={`text-[8px] font-bold uppercase tracking-widest ${suggested ? 'text-blue-400' : 'text-red-400'}`}>
                                 Suggested: {suggested ? 'ON' : 'OFF'}
                               </span>
                             )}
                           </div>
                        </div>
                        {record?.status ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      </button>
                    );
                  })}
               </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
