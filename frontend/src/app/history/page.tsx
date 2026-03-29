"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import apiClient from '@/lib/api-client';
import { 
  ChevronLeft, ChevronRight, PieChart,
  DollarSign, Calendar, Shield, Info, Download
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  const handleUpdateExtraMeals = async (userId: string, count: number) => {
    try {
      await apiClient.post('/api/stats/extra-meals', {
        month: monthStr,
        userId,
        count
      });
      fetchStats();
    } catch (error) { alert('Failed to update extra meals'); }
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: getDaysInMonth(month.getFullYear(), month.getMonth()) }, (_, i) => i + 1);

  if (!user) return null;

  const extraMealsCount = data?.extraMeals?.reduce((acc: number, curr: any) => acc + curr.count, 0) || 0;
  const totalMeals = (data?.attendance.reduce((acc: number, curr: any) => 
    acc + (curr.isOfficial ? curr.records.filter((r: any) => r.status).length : 0), 0) || 0) + extraMealsCount;
  const totalExpenses = data?.expenses.reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;
  const mealCharge = data?.savedStat ? data.savedStat.mealCharge : (totalMeals > 0 ? totalExpenses / totalMeals : 0);
  const totalPayments = data?.payments.reduce((acc: number, curr: any) => acc + curr.amount, 0) || 0;

  const memberSummaries = data?.members.map((member: any) => {
    const extraMeals = data?.extraMeals?.find((em: any) => em.userId === member._id)?.count || 0;
    const meals = data.attendance.reduce((acc: number, curr: any) => 
      acc + (curr.isOfficial ? curr.records.filter((r: any) => r.userId === member._id && r.status).length : 0), 0) + extraMeals;
    const paid = data.payments
      .filter((p: any) => (p.userId?._id || p.userId) === member._id)
      .reduce((acc: number, p: any) => acc + p.amount, 0);
    const cookingChargePerUser = data.pg?.cookingChargePerUser?.[member._id] || 0;
    const cookingCharge = meals > 0 ? cookingChargePerUser : 0;
    const mealCost = meals * mealCharge;
    const balance = paid - mealCost - cookingCharge;

    return {
      id: member._id,
      name: member.name,
      role: member.role,
      meals,
      extraMeals,
      mealCost,
      paid,
      cookingCharge,
      balance,
    };
  }) || [];

  const handleDownloadPdf = () => {
    if (!data) return;

    const doc = new jsPDF({ unit: 'pt' });
    const pgName = data.pg?.name || 'PG';
    const title = `${pgName} Monthly Report - ${monthStr}`;
    doc.setFontSize(16);
    doc.text(title, 40, 40);

    doc.setFontSize(12);
    doc.text('Monthly Totals', 40, 70);
    autoTable(doc, {
      startY: 80,
      head: [['Metric', 'Value']],
      body: [
        ['Total Meals', totalMeals],
        ['Meal Charge', `Rs ${mealCharge.toFixed(2)}`],
        ['Total Spent', `Rs ${totalExpenses.toFixed(0)}`],
        ['Total Paid', `Rs ${totalPayments.toFixed(0)}`],
      ],
      styles: { fontSize: 9 },
      theme: 'grid',
    });

    let nextY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 20 : 120;
    doc.text('Individual Summary', 40, nextY);
    autoTable(doc, {
      startY: nextY + 10,
      head: [[
        'Member',
        // 'Attendance',
        // 'Extra',
        'Total Meals',
        'Meal Cost',
        'Paid',
        'Chef Fee',
        'Balance'
      ]],
      body: memberSummaries.map((row: any) => [
        row.name,
        // row.meals - row.extraMeals,
        // row.extraMeals,
        row.meals,
        `Rs ${row.mealCost.toFixed(0)}`,
        `Rs ${row.paid}`,
        `Rs ${row.cookingCharge}`,
        `Rs ${row.balance.toFixed(0)}`,
      ]),
      styles: { fontSize: 9 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const balance = memberSummaries[data.row.index]?.balance;
          if (typeof balance === 'number' && balance < 0) {
            data.cell.styles.textColor = [220, 38, 38];
          }
        }
      },
      theme: 'grid',
    });

    const attendanceMap = new Map<number, Map<string, number>>();
    data.attendance
      .filter((record: any) => record.isOfficial)
      .forEach((record: any) => {
        const dateObj = new Date(record.date);
        const day = dateObj.getDate();
        if (!attendanceMap.has(day)) {
          attendanceMap.set(day, new Map());
        }
        record.records
          .filter((r: any) => r.status)
          .forEach((r: any) => {
            const dayMap = attendanceMap.get(day)!;
            const current = dayMap.get(r.userId) || 0;
            dayMap.set(r.userId, current + 1);
          });
      });

    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const dayLabels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));

    const attendanceRows = data.members.map((member: any) => {
      const dayCounts = dayLabels.map((label) => {
        const day = Number(label);
        return attendanceMap.get(day)?.get(member._id) || 0;
      });
      const total = dayCounts.reduce((acc: number, value: number) => acc + value, 0);
      return [member.name, ...dayCounts, total];
    });

    nextY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 20 : 120;
    doc.text('Meal Count Summary', 40, nextY);
    const attendanceHead = ['Member', ...dayLabels, 'Total'];
    const attendanceEmptyRow = Array(attendanceHead.length).fill('-');
    autoTable(doc, {
      startY: nextY + 10,
      head: [attendanceHead],
      body: attendanceRows.length > 0 ? attendanceRows : [attendanceEmptyRow],
      styles: { fontSize: 7 },
      theme: 'grid',
    });

    const paymentMap = new Map<string, Map<number, number>>();
    const paymentDays = new Set<number>();
    data.payments.forEach((payment: any) => {
      const name = payment.userId?.name || 'Unknown';
      const day = new Date(payment.date).getDate();
      paymentDays.add(day);
      if (!paymentMap.has(name)) {
        paymentMap.set(name, new Map());
      }
      const memberMap = paymentMap.get(name)!;
      memberMap.set(day, (memberMap.get(day) || 0) + payment.amount);
    });

    const paymentDayLabels = Array.from(paymentDays).sort((a, b) => a - b).map((day) => String(day));

    const paymentRows = Array.from(paymentMap.entries()).map(([name, dayMap]) => {
      const dayAmounts = paymentDayLabels.map((label) => {
        const day = Number(label);
        return dayMap.get(day) ? `Rs ${dayMap.get(day)}` : '-';
      });
      const total = Array.from(dayMap.values()).reduce((acc, value) => acc + value, 0);
      return [name, ...dayAmounts, `Rs ${total}`];
    });

    nextY = (doc as any).lastAutoTable.finalY + 20;
    doc.text('Payment Summary', 40, nextY);
    autoTable(doc, {
      startY: nextY + 10,
      head: [['Member', ...paymentDayLabels, 'Total']],
      body: paymentRows.length > 0 ? paymentRows : [Array(paymentDayLabels.length + 2).fill('-')],
      styles: { fontSize: 7 },
      theme: 'grid',
    });

    nextY = (doc as any).lastAutoTable.finalY + 20;
    doc.text('Spent Summary', 40, nextY);
    autoTable(doc, {
      startY: nextY + 10,
      head: [['Date', 'Description', 'Amount']],
      body: data.expenses.map((e: any) => [
        new Date(e.date).toLocaleDateString('en-GB'),
        e.description,
        `Rs ${e.amount}`,
      ]),
      styles: { fontSize: 9 },
      theme: 'grid',
    });

    doc.save(`pgmaster-${monthStr}-summary.pdf`);
  };

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
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-center">Regular</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-center">Extra</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-center">Total</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-center">Meal Cost</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-center">Paid</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-center">Chef Fee</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {memberSummaries.map((member: any) => (
                      <tr key={member.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-all">
                        <td className="p-4">
                           <p className="text-sm font-bold tracking-tight">{member.name}</p>
                           <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">{member.role}</p>
                        </td>
                        <td className="p-4 text-sm font-black text-center text-neutral-400">{member.meals - member.extraMeals}</td>
                        <td className="p-4 text-sm font-black text-center">
                          {user.role === 'MANAGER' && !data.savedStat?.isLocked ? (
                            <input 
                              type="number" 
                              min="0"
                              value={member.extraMeals}
                              onChange={(e) => handleUpdateExtraMeals(member.id, parseInt(e.target.value) || 0)}
                              className="w-12 bg-white/5 border border-white/10 rounded text-center text-xs p-1 focus:outline-none focus:border-primary/50"
                            />
                          ) : (
                            member.extraMeals
                          )}
                        </td>
                        <td className="p-4 text-sm font-black text-center">{member.meals}</td>
                        <td className="p-4 text-xs font-bold text-center text-neutral-500 italic">₹{member.mealCost.toFixed(0)}</td>
                        <td className="p-4 text-sm font-black text-center text-primary">₹{member.paid}</td>
                        <td className="p-4 text-sm font-black text-center text-orange-400">₹{member.cookingCharge}</td>
                        <td className={`p-4 text-base font-black text-right ${member.balance >= 0 ? 'text-primary' : 'text-red-500'}`}>
                          ₹{member.balance.toFixed(0)}
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

            <Card className="border-primary/10 bg-black/30 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex gap-3">
                <Download className="text-primary mt-1" />
                <div>
                  <h4 className="font-black text-sm uppercase italic tracking-tighter">Export Monthly PDF</h4>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest leading-none">
                    Individual, attendance, payments, and spend summary
                  </p>
                </div>
              </div>
              <Button size="md" onClick={handleDownloadPdf}>
                Download {month.toLocaleDateString('en-US', { month: 'long' })}
              </Button>
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

          <Card>
            <div className="flex items-center gap-2 mb-8">
               <DollarSign size={16} className="text-primary" />
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 italic">Spent Summary</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[520px]">
                <thead>
                  <tr className="bg-white/5">
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">Date</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">Description</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expenses.map((expense: any) => (
                    <tr key={expense._id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-all">
                      <td className="p-4 text-xs font-bold text-neutral-500">
                        {new Date(expense.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="p-4 text-sm font-bold">
                        {expense.description}
                      </td>
                      <td className="p-4 text-sm font-black text-right text-primary">
                        Rs {expense.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <div className="p-20 text-center text-neutral-500 font-bold uppercase tracking-widest italic">No Data Available</div>
      )}
    </div>
  );
}
