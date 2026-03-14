"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import apiClient from '@/lib/api-client';
import { 
  User as UserIcon, Shield, Key, RefreshCcw, 
  Plus, Utensils, DollarSign, Trash2, Edit2, Users
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface Member {
  _id: string;
  name: string;
  phoneNumber: string;
  role: string;
  uniqueKey?: string;
}

interface GlobalStats {
  attendance: any[];
  expenses: any[];
  payments: any[];
  members: Member[];
  savedStat?: {
    mealCharge: number;
    isLocked: boolean;
  };
}

export default function ProfilePage() {
  const { user, refreshProfile, logout } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [resetting, setResetting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', phoneNumber: '' });
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editingCharge, setEditingCharge] = useState<{ userId: string, amount: string } | null>(null);

  useEffect(() => {
    if (user?.pgId) {
      fetchMembers();
      fetchGlobalStats();
    }
  }, [user]);

  const fetchGlobalStats = async () => {
    const monthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    try {
      const res = await apiClient.get(`/api/stats/monthly?month=${monthStr}`);
      setStats(res.data);
    } catch (error) { console.error(error); }
  };

  const fetchMembers = async () => {
    try {
      const res = await apiClient.get('/api/pg/members');
      setMembers(res.data);
    } catch (error) { console.error(error); }
  };

  const handleResetKey = async () => {
    if (!confirm('Are you sure you want to change your unique key? You will be logged out and must use the new key.')) return;
    setResetting(true);
    try {
      const res = await apiClient.post('/api/auth/reset-key');
      alert(`Your new key is: ${res.data.newKey}. Save it carefully!`);
      await logout();
    } catch (error) { alert('Failed to reset key'); } finally { setResetting(false); }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await apiClient.post('/api/pg/members', newMember);
      alert(`Member added! Initial Key: ${res.data.uniqueKey}`);
      setNewMember({ name: '', phoneNumber: '' });
      fetchMembers();
    } catch (error: any) { alert(error.response?.data?.error || 'Failed to add member'); } finally { setAdding(false); }
  };

  const handleResetMemberKey = async (memberId: string, memberName: string) => {
    if (!confirm(`Reset key for ${memberName}? They will need the new key to login.`)) return;
    try {
      await apiClient.patch('/api/pg/members', { userId: memberId });
      alert(`Key reset successfully for ${memberName}`);
      fetchMembers();
    } catch (error) { alert('Failed to reset member key'); }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      await apiClient.post('/api/payments', {
        userId: selectedMember._id,
        amount: parseFloat(paymentAmount),
        note: 'Member Deposit'
      });
      setShowPayModal(false);
      setPaymentAmount('');
      fetchGlobalStats();
    } catch (error) { alert('Failed to record payment'); }
  };

  const handleUpdateCookingCharge = async () => {
    if (!editingCharge) return;
    try {
      const updatedCharges = { ...(user.pgId?.cookingChargePerUser || {}) };
      updatedCharges[editingCharge.userId] = parseFloat(editingCharge.amount);
      await apiClient.patch('/api/pg', { cookingChargePerUser: updatedCharges });
      setEditingCharge(null);
      refreshProfile();
    } catch (error) { alert('Failed to update chef fee'); }
  };

  const handleTransferManager = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to transfer Manager rights to ${memberName}? You will become a regular member and this action cannot be undone.`)) return;
    try {
      await apiClient.post('/api/pg/transfer', { newManagerId: memberId });
      alert('Rights transferred successfully!');
      refreshProfile();
      window.location.reload(); // Reload to update UI roles
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to transfer rights');
    }
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const isExpense = editingRecord.spentBy !== undefined;
    const url = isExpense ? `/api/expenses/${editingRecord._id}` : `/api/payments/${editingRecord._id}`;
    try {
      await apiClient.patch(url, editingRecord);
      setEditingRecord(null);
      fetchGlobalStats();
    } catch (error) { alert('Failed to update'); }
  };

  const calculateBalance = (userId: string) => {
    if (!stats) return 0;
    const userPayments = stats.payments.filter((p: any) => (p.userId?._id || p.userId) === userId).reduce((acc: number, p: any) => acc + p.amount, 0);
    const totalExpenses = stats.expenses.reduce((acc: number, e: any) => acc + e.amount, 0);
    const totalMeals = stats.attendance.reduce((acc: number, curr: any) => 
      acc + (curr.isOfficial ? curr.records.filter((r: any) => r.status).length : 0), 0);
    const mealCharge = stats.savedStat ? stats.savedStat.mealCharge : (totalMeals > 0 ? totalExpenses / totalMeals : 0);
    const userMeals = stats.attendance.reduce((acc: number, curr: any) => 
      acc + curr.records.filter((r: any) => r.userId === userId && r.status).length, 0);
    const cookingChargePerUser = user.pgId?.cookingChargePerUser?.[userId] || 0;
    const userCookingCharge = userMeals > 0 ? cookingChargePerUser : 0;
    return userPayments - (userMeals * mealCharge) - userCookingCharge;
  };

  if (!user) return null;

  return (
    <div className="p-4 md:p-8 space-y-10">
      {/* Profile Header */}
      <header className="flex flex-col md:flex-row items-center gap-6 pb-10 border-b border-white/5">
        <div className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]">
          <UserIcon size={40} className="text-black" />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">{user.name}</h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black border border-primary/20 flex items-center gap-1 uppercase tracking-widest leading-none">
              <Shield size={10} /> {user.role}
            </span>
            <span className="px-3 py-1 bg-neutral-800 text-neutral-400 rounded-full text-[10px] font-black border border-border uppercase tracking-widest leading-none">
              {user.pgId?.name || 'No PG'}
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Account Details & Balance */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1">Your Balance</h3>
            <div className="flex items-end gap-2">
               <h2 className={`text-5xl font-black tracking-tighter ${calculateBalance(user._id) >= 0 ? 'text-primary' : 'text-red-500'}`}>
                 ₹{calculateBalance(user._id).toFixed(0)}
               </h2>
            </div>
            <p className="text-[10px] text-neutral-500 mt-4 leading-relaxed font-medium">Calculation: (Payments) - (Meals * ₹{stats?.savedStat?.mealCharge?.toFixed(0) || 'D'}) - (Chef Fee)</p>
          </Card>

          <Card>
            <div className="flex items-center gap-2 text-primary mb-6">
              <Key size={16} />
              <h3 className="text-[10px] font-bold uppercase tracking-widest">Access Key</h3>
            </div>
            <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
              <span className="text-xl font-mono font-black tracking-[0.2em] text-white">{user.uniqueKey}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleResetKey} 
                disabled={resetting}
                className="p-2 h-auto"
              >
                <RefreshCcw size={16} className={resetting ? 'animate-spin' : ''} />
              </Button>
            </div>
            <p className="text-[9px] text-neutral-500 mt-3 font-bold uppercase tracking-widest">Security: Keep this key private.</p>
          </Card>
        </div>

        {/* Member Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-neutral-500">PG Members</h2>
            {user.role === 'MANAGER' && (
              <Button size="sm" variant="outline" className="text-[10px]" onClick={() => setAdding(!adding)}>
                {adding ? 'Close' : 'Add Member'}
              </Button>
            )}
          </div>

          {adding && user.role === 'MANAGER' && (
            <Card className="border-primary/50 bg-primary/5">
              <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="Name" 
                  required 
                  className="bg-neutral-900 border border-border p-3 rounded-xl text-sm"
                  value={newMember.name} 
                  onChange={e => setNewMember({...newMember, name: e.target.value})}
                />
                <input 
                  type="tel" 
                  placeholder="Phone" 
                  required 
                  className="bg-neutral-900 border border-border p-3 rounded-xl text-sm"
                  value={newMember.phoneNumber} 
                  onChange={e => setNewMember({...newMember, phoneNumber: e.target.value})}
                />
                <Button type="submit" className="md:col-span-2">Add Member</Button>
              </form>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map(m => (
              <Card key={m._id} className="relative group overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center text-sm font-black text-primary border border-white/5">
                      {m.name.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold flex items-center gap-2">
                        {m.name}
                        {m.role === 'MANAGER' && <Shield size={12} className="text-primary" />}
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-bold">{m.phoneNumber}</p>
                    </div>
                  </div>
                  <div className={`text-xs font-black p-2 rounded-lg bg-white/5 ${calculateBalance(m._id) >= 0 ? 'text-primary' : 'text-red-500'}`}>
                    ₹{calculateBalance(m._id).toFixed(0)}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2">
                   {user.role === 'MANAGER' && (
                     <>
                        <Button size="sm" variant="secondary" className="px-2 py-1 text-[9px] h-auto" onClick={() => { setSelectedMember(m); setShowPayModal(true); }}>
                          Pay
                        </Button>
                        <Button size="sm" variant="ghost" className="px-2 py-1 text-[9px] h-auto" onClick={() => handleResetMemberKey(m._id, m.name)}>
                          Reset
                        </Button>
                        {m._id !== user._id && (
                          <Button size="sm" variant="ghost" className="px-2 py-1 text-[9px] h-auto text-red-400 hover:bg-red-500/10" onClick={() => handleTransferManager(m._id, m.name)}>
                            Transfer
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="px-2 py-1 text-[9px] h-auto text-orange-400 border-orange-400/20" onClick={() => setEditingCharge({ userId: m._id, amount: (user.pgId?.cookingChargePerUser?.[m._id] || 0).toString() })}>
                          Chef Fee: ₹{user.pgId?.cookingChargePerUser?.[m._id] || 0}
                        </Button>
                     </>
                   )}
                   {user.role === 'MANAGER' && m._id !== user._id && (
                     <div className="w-full mt-2 p-2 bg-black/40 rounded-lg border border-white/5 text-[10px] font-mono text-primary flex justify-between items-center">
                        <span>Key: {m.uniqueKey}</span>
                        <Plus size={10} className="rotate-45" />
                     </div>
                   )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title={`Record Payment: ${selectedMember?.name}`}>
        <form onSubmit={handleAddPayment} className="space-y-4">
          <input 
            type="number" 
            required 
            placeholder="Amount (₹)" 
            className="w-full bg-neutral-900 p-4 border border-border rounded-xl"
            value={paymentAmount} 
            onChange={e => setPaymentAmount(e.target.value)} 
          />
          <Button type="submit" fullWidth>Complete Payment</Button>
        </form>
      </Modal>

      <Modal isOpen={!!editingCharge} onClose={() => setEditingCharge(null)} title="Update Chef Fee">
        <div className="space-y-4">
          <input 
            type="number" 
            className="w-full bg-neutral-900 p-4 border border-border rounded-xl"
            value={editingCharge?.amount || ''}
            onChange={(e) => setEditingCharge(prev => prev ? { ...prev, amount: e.target.value } : null)}
          />
          <Button fullWidth onClick={handleUpdateCookingCharge}>Save Changes</Button>
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
