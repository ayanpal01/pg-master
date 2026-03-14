"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import apiClient from '@/lib/api-client';
import { 
  ChevronLeft, ChevronRight, PieChart, Users, 
  DollarSign, Calendar, Shield, Info, ArrowUpRight
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';

export default function HistoryPage() {
  const { user } = useAuth();
  const [month, setMonth] = useState(new Date());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const monthStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;

  useEffect(() => {
    fetchStats();
  }, [monthStr, user]);

  const fetchStats = async () => {
    if (!user?.pgId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/stats/monthly?month=${monthStr}`);
      setData(res.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleFinalize = async (mealCharge: number, totalMeals: number, totalExpenses: number) => {
    if (!confirm(`Finalize billing for ${monthStr} with a Meal Charge of ₹${mealCharge}? This will lock the month.`)) return;
    try {
      await apiClient.post('/api/stats/monthly/finalize', {
        month: monthStr,
        mealCharge,
        totalMeals,
        totalExpenses
      });
      alert('Month finalized and billing locked!');
      fetchStats();
    } catch (error) { alert('Failed to finalize month'); }
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: getDaysInMonth(month.getFullYear(), month.getMonth()) }, (_, i) => i + 1);

  if (!user) return null;

  const totalMeals = data?.attendance.reduce((acc: number, curr: any) => 
    acc + (curr.isOfficial ? curr.records.filter((r: any) => r.status).length : 0), 0) || 0;
  const totalExpenses = data?.expenses.reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;
  const mealCharge = data?.savedStat ? data.savedStat.mealCharge : (totalMeals > 0 ? totalExpenses / totalMeals : 0);
  const totalPayments = data?.payments.reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header & Month Selector */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">Finance History</h1>
          <p className="text-neutral-500 font-bold text-xs uppercase tracking-widest">Reports & Audit Logs</p>
        </div>

        <div className="flex items-center gap-4 bg-black/40 p-2 rounded-2xl border border-white/5 shadow-inner">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2 h-auto"
            onClick={() => setMonth(new Date(month.setMonth(month.getMonth() - 1)))}
          >
            <ChevronLeft size={20} />
          </Button>
          <div className="min-w-[120px] text-center">
             <p className="text-sm font-black uppercase tracking-widest italic">{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2 h-auto"
            onClick={() => setMonth(new Date(month.setMonth(month.getMonth() + 1)))}
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="p-20 text-center animate-pulse text-primary font-black uppercase tracking-widest">Syncing Records...</div>
      ) : data ? (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Meals" value={totalMeals} icon={<PieChart />} color="primary" />
            <StatCard label="Total Spent" value={`₹${totalExpenses.toFixed(0)}`} icon={<DollarSign />} color="orange" />
            <StatCard label="Meal Charge" value={`₹${mealCharge.toFixed(2)}`} icon={<Info />} color="accent" />

            <StatCard label="Total Paid" value={`₹${totalPayments.toFixed(0)}`} icon={<DollarSign />} color="primary" />
          </div>

          {user.role === 'MANAGER' && !data.savedStat?.isLocked && (
            <Card className="border-primary/20 bg-primary/5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex gap-3">
                 <Shield className="text-primary mt-1" />
                 <div>
                    <h4 className="font-black text-sm uppercase italic tracking-tighter">Billing Unlocked</h4>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest leading-none">Review and finalize to persist balance deductions.</p>
                 </div>
              </div>
              <Button size="md" onClick={() => handleFinalize(mealCharge, totalMeals, totalExpenses)}>
                Finalize {month.toLocaleDateString('en-US', { month: 'long' })}
              </Button>
            </Card>
          )}

          {data.savedStat?.isLocked && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
               <Shield size={20} className="text-primary" />
               <span className="text-xs font-black uppercase tracking-widest text-primary italic">Billing Cycle Locked • Records Finalized</span>
            </div>
          )}

          {/* Detailed Financial Summary */}
          <Card>
            <div className="flex items-center gap-2 mb-8">
               <DollarSign size={16} className="text-primary" />
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 italic">Individual Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-white/5">
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">Member</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-center">Meals</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-center">Meal Cost</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-center">Paid</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-center">Chef Fee</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.members.map((member: any) => {
                    const meals = data.attendance.reduce((acc: number, curr: any) => 
                      acc + (curr.isOfficial ? curr.records.filter((r: any) => r.userId === member._id && r.status).length : 0), 0);
                    const paid = data.payments.filter((p: any) => (p.userId?._id || p.userId) === member._id).reduce((acc: number, p: any) => acc + p.amount, 0);
                    const cookingChargePerUser = data.pg?.cookingChargePerUser?.[member._id] || 0;
                    const cookingCharge = meals > 0 ? cookingChargePerUser : 0;
                    const mealCost = meals * mealCharge;
                    const balance = paid - mealCost - cookingCharge;

                    return (
                      <tr key={member._id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-all">
                        <td className="p-4">
                           <p className="text-sm font-bold tracking-tight">{member.name}</p>
                           <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">{member.role}</p>
                        </td>
                        <td className="p-4 text-sm font-black text-center">{meals}</td>
                        <td className="p-4 text-xs font-bold text-center text-neutral-500 italic">₹{mealCost.toFixed(0)}</td>
                        <td className="p-4 text-sm font-black text-center text-primary">₹{paid}</td>
                        <td className="p-4 text-sm font-black text-center text-orange-400">₹{cookingCharge}</td>
                        <td className={`p-4 text-base font-black text-right ${balance >= 0 ? 'text-primary' : 'text-red-500'}`}>
                          ₹{balance.toFixed(0)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Grid View */}
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 mb-8">
               <Calendar size={16} className="text-primary" />
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 italic">Attendance & Payment Grid</h3>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5">
                    <th className="p-4 text-[10px] font-bold sticky left-0 bg-neutral-900 border-r border-white/5 z-10 w-24">Member</th>
                    {days.map(d => (
                      <th key={d} className="p-2 text-[10px] font-bold text-center min-w-[40px] border-r border-white/5">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.members.map((member: any) => (
                    <tr key={member._id} className="border-b border-white/5 group hover:bg-white/5">
                      <td className="p-4 text-[11px] font-black uppercase tracking-tight sticky left-0 bg-neutral-900 border-r border-white/10 z-10">
                        {member.name.split(' ')[0]}
                      </td>
                      {days.map(d => {
                        const dayDate = new Date(month.getFullYear(), month.getMonth(), d);
                        const att = data.attendance.find((a: any) => new Date(a.date).toDateString() === dayDate.toDateString());
                        const userAtt = (att?.isOfficial ? att?.records.filter((r: any) => r.userId === member._id && r.status) : []) || [];
                        const userPay = data.payments.find((p: any) => (p.userId?._id || p.userId) === member._id && new Date(p.date).toDateString() === dayDate.toDateString());

                        return (
                          <td key={d} className="p-1 border-r border-white/5 text-center align-middle">
                            <div className="flex flex-col items-center gap-1 min-h-[44px] justify-center">
                              {userAtt.length > 0 && (
                                <div className="flex gap-0.5">
                                  {userAtt.map((_: any, i: number) => (
                                    <div key={i} className={`w-2 h-2 rounded-full  ${i%2==0 ? 'bg-gray-500' : 'bg-purple-500'}`}/>
                                  ))}
                                </div>
                              )}
                              {userPay && (
                                <div className={`text-[12px] font-black flex flex-col items-center ${userPay.amount > 0 ? 'text-blue-500' : 'text-red-500'}`}>
                                  ₹{userPay.amount}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* info for color */}
              <div className="flex items-center gap-2 mt-4 italic text-xs">
                <p className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full  bg-gray-500`}/> Lunch</p>
                <p className="flex items-center gap-1"><span className={`w-2 h-2 rounded-full  bg-purple-500`}/> Dinner</p>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <div className="p-20 text-center text-neutral-500 font-bold uppercase tracking-widest italic">No Data Available</div>
      )}
    </div>
  );
}
