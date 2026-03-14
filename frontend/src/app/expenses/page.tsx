"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import apiClient from '@/lib/api-client';
import { ChevronLeft, Plus, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newExp, setNewExp] = useState({ amount: '', description: '', spentBy: '' });
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    fetchExpenses();
    if (user?.role === 'MANAGER') fetchMembers();
  }, [status, user]);

  const fetchMembers = async () => {
    try {
      const res = await apiClient.get('/api/pg/members');
      setMembers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchExpenses = async () => {
    if (!user?.pgId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/expenses?status=${status}`);
      setExpenses(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/expenses', {
        ...newExp,
        amount: parseFloat(newExp.amount),
        spentBy: newExp.spentBy || user?._id,
        date: new Date().toISOString()
      });
      setShowAdd(false);
      setNewExp({ amount: '', description: '', spentBy: '' });
      fetchExpenses();
    } catch (error) {
      alert('Error adding expense');
    }
  };

  const handleAction = async (expenseId: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      await apiClient.patch('/api/expenses', { expenseId, status: action });
      fetchExpenses();
    } catch (error) {
      alert('Error updating expense');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="p-6 flex items-center justify-between">
        <Link href="/dashboard" className="text-primary flex items-center gap-2">
          <ChevronLeft className="w-5 h-5" />
          Back
        </Link>
        <h1 className="text-xl font-bold">Expenses</h1>
        <button onClick={() => setShowAdd(true)} className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-black">
          <Plus />
        </button>
      </div>

      <div className="px-6 flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {['PENDING', 'APPROVED', 'REJECTED'].map(s => (
          <button
            key={s}
            onClick={() => setStatus(s as any)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border ${
              status === s ? 'bg-primary border-primary text-black' : 'border-border text-neutral-500'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="px-6 space-y-4">
        {loading ? <p className="text-center text-primary">Loading...</p> : 
         expenses.length === 0 ? <p className="text-center text-neutral-500 py-10">No {status.toLowerCase()} expenses.</p> :
         expenses.map(exp => (
          <div key={exp._id} className="glass-card p-4 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold">{exp.description}</p>
                <p className="text-xs text-neutral-500">
                  By {exp.createdBy.name} 
                  {exp.spentBy?._id !== exp.createdBy._id && ` for ${exp.spentBy?.name}`} • {new Date(exp.date).toLocaleDateString()}
                </p>
              </div>
              <p className="text-xl font-bold text-primary">${exp.amount}</p>
            </div>
            
            {status === 'PENDING' && user?.role === 'MANAGER' && (
              <div className="flex gap-2 mt-4">
                <button onClick={() => handleAction(exp._id, 'APPROVED')} className="flex-1 bg-primary/20 text-primary py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => handleAction(exp._id, 'REJECTED')} className="flex-1 bg-red-500/10 text-red-500 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-6">Add New Expense</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <input 
                type="number" 
                placeholder="Amount" 
                className="w-full bg-neutral-900 border border-border rounded-lg p-3"
                value={newExp.amount}
                onChange={e => setNewExp({...newExp, amount: e.target.value})}
                required
              />
              {user?.role === 'MANAGER' && (
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Spent By</label>
                  <select 
                    className="w-full bg-neutral-900 border border-border rounded-lg p-3 text-sm"
                    value={newExp.spentBy}
                    onChange={e => setNewExp({...newExp, spentBy: e.target.value})}
                  >
                    <option value="">Myself ({user.name})</option>
                    {members.filter(m => m._id !== user._id).map(m => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <textarea 
                placeholder="Description" 
                className="w-full bg-neutral-900 border border-border rounded-lg p-3 h-24"
                value={newExp.description}
                onChange={e => setNewExp({...newExp, description: e.target.value})}
                required
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3 text-neutral-500">Cancel</button>
                <button type="submit" className="flex-1 btn-primary py-3">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
