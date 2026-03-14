"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Utensils, DollarSign, ChefHat, Plus, Wallet, 
  ArrowUpRight, PieChart, Users, Settings,
  TrendingUp, Calendar
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { Modal } from '@/components/ui/Modal';
import apiClient from '@/lib/api-client';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const { user, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const [mealStatus, setMealStatus] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<any>(null);
  const [fetchingStats, setFetchingStats] = useState(false);
  
  // Modals state
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showChefFeeModal, setShowChefFeeModal] = useState(false);
  
  // Form states
  const [paymentData, setPaymentData] = useState({ userId: '', amount: '', note: 'Advance Payment' });
  const [expenseData, setExpenseData] = useState({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [chefFee, setChefFee] = useState('');
  
  // Master record managers
  const [showExpenseManager, setShowExpenseManager] = useState(false);
  const [showPaymentManager, setShowPaymentManager] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const fetchData = async () => {
    if (!user?.pgId) return;
    setFetchingStats(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const monthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      
      const [attRes, statsRes, membersRes] = await Promise.all([
        apiClient.get(`/api/attendance?date=${today}`),
        apiClient.get(`/api/stats/monthly?month=${monthStr}`),
        apiClient.get('/api/pg/members')
      ]);

      if (attRes.data?.records) {
        const userRecords = attRes.data.records.filter((r: any) => r.userId === user._id);
        const status: Record<string, boolean> = {};
        userRecords.forEach((r: any) => { 
          // Show either official status or proposed status as the current toggle state
          status[r.mealType] = r.memberProposedStatus !== undefined ? r.memberProposedStatus : r.status; 
        });
        setMealStatus(status);
      }
      
      setStats(statsRes.data);
      setMembers(membersRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setFetchingStats(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) router.push('/');
    if (user && !user.pgId) router.push('/setup-pg');
    if (user?.pgId) fetchData();
  }, [user, loading, router]);

  const toggleMeal = async (mealType: string, status: boolean) => {
    setMealStatus(prev => ({ ...prev, [mealType]: status }));
    try {
      await apiClient.post('/api/attendance', { toggle: true, mealType, status });
    } catch (error) {
      console.error('Failed to toggle meal:', error);
      fetchData();
    }
  };

  const handeAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/payments', paymentData);
      setShowAddPayment(false);
      setPaymentData({ userId: '', amount: '', note: 'Advance Payment' });
      fetchData();
    } catch (error) { alert('Failed to add payment'); }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/expenses', expenseData);
      setShowAddExpense(false);
      setExpenseData({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (error) { alert('Failed to add expense'); }
  };

  const handleUpdateChefFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedCharges = { ...(user.pgId?.cookingChargePerUser || {}) };
      updatedCharges[selectedMember._id] = parseFloat(chefFee);
      await apiClient.patch('/api/pg', { cookingChargePerUser: updatedCharges });
      setShowChefFeeModal(false);
      refreshProfile();
      fetchData();
    } catch (error) { alert('Failed to update chef fee'); }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await apiClient.delete(`/api/expenses/${id}`);
      fetchData();
    } catch (error) { alert('Failed to delete expense'); }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Delete this payment?')) return;
    try {
      await apiClient.delete(`/api/payments/${id}`);
      fetchData();
    } catch (error) { alert('Failed to delete payment'); }
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const isExpense = editingRecord.spentBy !== undefined;
    const url = isExpense ? `/api/expenses/${editingRecord._id}` : `/api/payments/${editingRecord._id}`;
    try {
      await apiClient.patch(url, editingRecord);
      setEditingRecord(null);
      fetchData();
    } catch (error) { alert('Failed to update'); }
  };

  const chartData = useMemo(() => {
    if (!stats) return [];
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      let meals = 0;
      let expenses = 0;
      stats.attendance.forEach((att: any) => {
        // Only count official meals
        if (att.isOfficial && new Date(att.date).getDate() === day) {
          meals += att.records.filter((r: any) => r.status).length;
        }
      });
      stats.expenses.forEach((exp: any) => {
        if (new Date(exp.date).getDate() === day) expenses += exp.amount;
      });
      return { day, meals, expenses };
    });
  }, [stats]);

  const memberStats = useMemo(() => {
    if (!stats || !user) return null;
    const myPayments = stats.payments.filter((p: any) => (p.userId?._id || p.userId) === user._id).reduce((acc: number, p: any) => acc + p.amount, 0);
    const myMeals = stats.attendance.reduce((acc: number, curr: any) => 
      acc + curr.records.filter((r: any) => r.userId === user._id && r.status).length, 0);
    const totalExpenses = stats.expenses.reduce((acc: number, e: any) => acc + e.amount, 0);
    const totalMeals = stats.attendance.reduce((acc: number, curr: any) => 
      acc + (curr.isOfficial ? curr.records.filter((r: any) => r.status).length : 0), 0);
    const mealCharge = stats.savedStat ? stats.savedStat.mealCharge : (totalMeals > 0 ? totalExpenses / totalMeals : 0);
    const cookingChargePerUser = user.pgId?.cookingChargePerUser?.[user._id] || 0;
    const myCookingCharge = myMeals > 0 ? cookingChargePerUser : 0;
    const balance = myPayments - (myMeals * mealCharge) - myCookingCharge;
    return { myMeals, myPayments, balance, mealCharge, myCookingCharge };
  }, [stats, user]);

  if (loading || !user) return null;

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Overview</h1>
          <p className="text-neutral-500 font-bold text-xs uppercase tracking-widest">{user.pgId?.name} • Monthly Report</p>
        </div>
        
        {user.role === 'MANAGER' && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowAddPayment(true)} className="gap-2">
              <Plus size={16} /> Payment
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowAddExpense(true)} className="gap-2">
              <Plus size={16} /> Expense
            </Button>
          </div>
        )}
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {user.role === 'MEMBER' ? (
          <>
            <div className="sm:col-span-2 lg:col-span-1">
              <StatCard 
                label="My Balance" 
                value={`₹${memberStats?.balance.toFixed(0) || 0}`} 
                icon={<Wallet />}
                color={memberStats && memberStats.balance < 0 ? 'red' : 'primary'}
                description={`Payments: ₹${memberStats?.myPayments}`}
                className="md:p-4 p-3" // Smaller padding on mobile
              />
            </div>
            <StatCard label="Total Meals" value={memberStats?.myMeals || 0} icon={<Utensils />} color="orange" className="md:p-4 p-3" />
            <StatCard label="Meal Charge" value={`₹${memberStats?.mealCharge.toFixed(0) || 0}`} icon={<PieChart />} color="accent" className="md:p-4 p-3" />
            <StatCard label="Chef Fee" value={`₹${memberStats?.myCookingCharge || 0}`} icon={<ChefHat />} color="orange" className="md:p-4 p-3" />
          </>
        ) : (
          <>
            <StatCard 
              label="Monthly Spend" 
              value={`₹${stats?.expenses.reduce((acc: number, e: any) => acc + e.amount, 0).toFixed(0) || 0}`} 
              icon={<DollarSign />} 
              color="orange"
            />
            <StatCard 
              label="Total Meals" 
              value={stats?.attendance.reduce((acc: number, curr: any) => acc + curr.records.filter((r: any) => r.status).length, 0) || 0} 
              icon={<Utensils />} 
            />
            <StatCard 
              label="Cash on Hand" 
              value={`₹${(stats?.payments.reduce((acc: number, p: any) => acc + p.amount, 0) - stats?.expenses.reduce((acc: number, e: any) => acc + e.amount, 0)).toFixed(0) || 0}`} 
              icon={<Wallet />} 
              color="primary"
            />
            <StatCard label="Members" value={members.length} icon={<Users />} color="accent" />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Meals & Actions */}
        <div className="lg:col-span-1 space-y-8">
          <Card>
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-6">Today's Meals</h3>
            <div className="space-y-4">
              {user.pgId?.mealTypes.map((meal: string) => (
                <div key={meal} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="font-bold text-sm tracking-wide">{meal}</span>
                  <div className="flex p-1 bg-black/40 rounded-lg border border-white/5">
                    <button 
                      onClick={() => toggleMeal(meal, true)}
                      className={`px-4 py-1.5 rounded-md text-[10px] font-black transition-all ${mealStatus[meal] === true ? 'bg-primary text-black shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]' : 'text-neutral-600'}`}
                    >ON</button>
                    <button 
                      onClick={() => toggleMeal(meal, false)}
                      className={`px-4 py-1.5 rounded-md text-[10px] font-black transition-all ${mealStatus[meal] === false ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'text-neutral-600'}`}
                    >OFF</button>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/history" className="mt-6 flex items-center justify-center p-3 rounded-xl border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
              Detailed History <ArrowUpRight size={14} className="ml-2" />
            </Link>
          </Card>

          {user.role === 'MANAGER' && (
            <Card>
              <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-6">Management Actions</h3>
              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="justify-start gap-3" onClick={() => setShowChefFeeModal(true)}>
                  <Settings size={18} /> Edit Chef Fees
                </Button>
                <Link href="/profile">
                  <Button variant="outline" className="w-full justify-start gap-3">
                    <Users size={18} /> Manage Members
                  </Button>
                </Link>
                <Button variant="outline" className="justify-start gap-3" onClick={() => setShowAddPayment(true)}>
                  <DollarSign size={18} /> Collect Payment
                </Button>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button variant="secondary" size="sm" className="gap-2 py-4" onClick={() => setShowExpenseManager(true)}>
                    <Utensils size={14} /> Manage Exp
                  </Button>
                  <Button variant="secondary" size="sm" className="gap-2 py-4" onClick={() => setShowPaymentManager(true)}>
                    <DollarSign size={14} /> Manage Pay
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Activity Graph (Manager Only) */}
        {user.role === 'MANAGER' && (
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 italic">Consumption & Spend</h3>
                <div className="flex gap-4">
                   <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" /><span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Meals</span></div>
                   <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,140,0,0.5)]" /><span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Expenses</span></div>
                </div>
              </div>
              
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorMeals" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FB8C00" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#FB8C00" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                    <XAxis dataKey="day" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                    
                    {/* Dual Axis Configuration */}
                    <YAxis yAxisId="left" stroke="var(--primary)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#FB8C00" fontSize={10} tickLine={false} axisLine={false} />
                    
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #262626', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    
                    <Area yAxisId="left" type="monotone" dataKey="meals" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorMeals)" />
                    <Area yAxisId="right" type="monotone" dataKey="expenses" stroke="#FB8C00" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 flex items-center gap-4 p-4 rounded-xl bg-orange-400/5 border border-orange-400/10">
                 <TrendingUp className="text-orange-400" size={24} />
                 <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400/70">Trend Analysis</p>
                    <p className="text-xs text-neutral-400 leading-tight">Your PG's daily meal average is <span className="text-white font-bold">{(stats?.attendance.reduce((acc: number, curr: any) => acc + (curr.isOfficial ? curr.records.filter((r: any) => r.status).length : 0), 0) / (new Date().getDate() || 1)).toFixed(1)}</span></p>
                 </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={showAddPayment} onClose={() => setShowAddPayment(false)} title="Collect Payment">
        <form onSubmit={handeAddPayment} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">Select Member</label>
            <select 
              required
              className="w-full bg-neutral-900 border border-border rounded-xl p-3 text-sm focus:border-primary transition-all outline-none"
              value={paymentData.userId}
              onChange={(e) => setPaymentData({ ...paymentData, userId: e.target.value })}
            >
              <option value="">Choose a member...</option>
              {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">Amount (₹)</label>
            <input 
              type="number"
              required
              className="w-full bg-neutral-900 border border-border rounded-xl p-3 text-sm focus:border-primary transition-all outline-none"
              placeholder="0.00"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
            />
          </div>
          <Button type="submit" fullWidth className="mt-4">Record Payment</Button>
        </form>
      </Modal>

      <Modal isOpen={showAddExpense} onClose={() => setShowAddExpense(false)} title="Record Expense">
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">What was it for?</label>
            <input 
              type="text"
              required
              className="w-full bg-neutral-900 border border-border rounded-xl p-3 text-sm focus:border-primary transition-all outline-none"
              placeholder="e.g. Vegetables, Gas Cylinder..."
              value={expenseData.description}
              onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">Amount (₹)</label>
            <input 
              type="number"
              required
              className="w-full bg-neutral-900 border border-border rounded-xl p-3 text-sm focus:border-primary transition-all outline-none"
              placeholder="0.00"
              value={expenseData.amount}
              onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
            />
          </div>
          <Button type="submit" fullWidth className="mt-4">Save Expense</Button>
        </form>
      </Modal>

      <Modal isOpen={showChefFeeModal} onClose={() => setShowChefFeeModal(false)} title="Set Chef Fees" maxWidth="md">
        <div className="space-y-4">
          {members.map(m => (
            <div key={m._id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="text-sm font-bold">{m.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">₹</span>
                <input 
                  type="number"
                  className="w-20 bg-black/40 border border-white/10 rounded-lg p-2 text-xs font-bold outline-none focus:border-primary"
                  defaultValue={user.pgId?.cookingChargePerUser?.[m._id] || 0}
                  onBlur={(e) => {
                    setSelectedMember(m);
                    setChefFee(e.target.value);
                  }}
                />
                <Button size="sm" variant="ghost" className="text-primary p-2" onClick={handleUpdateChefFee}>Save</Button>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Record Manager Modals */}
      <Modal isOpen={showExpenseManager} onClose={() => setShowExpenseManager(false)} title="PG Expenses Tracking" maxWidth="lg">
        <div className="space-y-3">
          {stats?.expenses.map((e: any) => (
            <div key={e._id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group  ">
              <div>
                <p className="font-bold text-sm tracking-wide">{e.description}</p>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{new Date(e.date).toLocaleDateString()} • {e.status}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-black text-orange-400">₹{e.amount}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditingRecord(e)}><Settings size={14} /></Button>
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteExpense(e._id)}><Plus size={14} className="rotate-45" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={showPaymentManager} onClose={() => setShowPaymentManager(false)} title="PG Payment Logs" maxWidth="lg">
        <div className="space-y-3">
          {stats?.payments.map((p: any) => (
            <div key={p._id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group  ">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-black text-primary text-[10px]">
                  {p.userId?.name?.substring(0,2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-sm tracking-wide">{p.userId?.name}</p>
                  <p className="text-[10px] text-neutral-500 font-bold tracking-widest uppercase">{new Date(p.date).toLocaleDateString()} • {p.note}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-black text-primary">₹{p.amount}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditingRecord(p)}><Settings size={14} /></Button>
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeletePayment(p._id)}><Plus size={14} className="rotate-45" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {editingRecord && (
        <Modal isOpen={!!editingRecord} onClose={() => setEditingRecord(null)} title={`Edit ${editingRecord.spentBy !== undefined ? 'Expense' : 'Payment'}`}>
          <form onSubmit={handleUpdateRecord} className="space-y-4">
            <input 
              type="number" 
              className="w-full bg-neutral-900 border border-border rounded-xl p-4"
              value={editingRecord.amount}
              onChange={(e) => setEditingRecord({...editingRecord, amount: parseFloat(e.target.value)})}
            />
            {editingRecord.description !== undefined && (
              <input 
                type="text" 
                className="w-full bg-neutral-900 border border-border rounded-xl p-4"
                value={editingRecord.description}
                onChange={(e) => setEditingRecord({...editingRecord, description: e.target.value})}
              />
            )}
            {editingRecord.note !== undefined && (
              <input 
                type="text" 
                className="w-full bg-neutral-900 border border-border rounded-xl p-4"
                value={editingRecord.note}
                onChange={(e) => setEditingRecord({...editingRecord, note: e.target.value})}
              />
            )}
            <Button type="submit" fullWidth>Update Record</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
