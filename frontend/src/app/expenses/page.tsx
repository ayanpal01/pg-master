"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import apiClient from '@/lib/api-client';
import { ChevronLeft, Plus, Check, X, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [viewMode, setViewMode] = useState<'LIST' | 'MONTHLY'>('LIST');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newExp, setNewExp] = useState({ amount: '', description: '', spentBy: '' });
  const [showEdit, setShowEdit] = useState(false);
  const [editingExp, setEditingExp] = useState<any | null>(null);
  const [editExp, setEditExp] = useState({ amount: '', description: '', spentBy: '' });
  const [members, setMembers] = useState<any[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<{ monthKey: string; label: string; total: number; count: number; date: Date }[]>([]);

  useEffect(() => {
    if (user?.role === 'MANAGER') fetchMembers();
  }, [user]);

  useEffect(() => {
    if (viewMode === 'MONTHLY') {
      fetchMonthlyTotals();
    } else {
      fetchExpenses();
    }
  }, [status, user, viewMode]);

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

  const fetchMonthlyTotals = async () => {
    if (!user?.pgId) return;
    setLoading(true);
    try {
      const res = await apiClient.get('/api/expenses?status=APPROVED');
      const grouped = groupExpensesByMonth(res.data);
      setMonthlyTotals(grouped);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const groupExpensesByMonth = (items: any[]) => {
    const map = new Map<string, { total: number; count: number; date: Date }>();
    items.forEach((exp) => {
      const expDate = new Date(exp.date);
      const key = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`;
      const existing = map.get(key);
      const total = (existing?.total ?? 0) + (exp.amount || 0);
      const count = (existing?.count ?? 0) + 1;
      map.set(key, { total, count, date: new Date(expDate.getFullYear(), expDate.getMonth(), 1) });
    });

    return Array.from(map.entries())
      .map(([monthKey, value]) => ({
        monthKey,
        label: value.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        total: value.total,
        count: value.count,
        date: value.date,
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
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

  const openEdit = (expense: any) => {
    setEditingExp(expense);
    setEditExp({
      amount: String(expense.amount ?? ''),
      description: expense.description ?? '',
      spentBy: expense.spentBy?._id || '',
    });
    setShowEdit(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExp) return;
    try {
      const payload: any = {
        amount: parseFloat(editExp.amount),
        description: editExp.description,
      };
      if (editExp.spentBy) {
        payload.spentBy = editExp.spentBy;
      }
      await apiClient.patch(`/api/expenses/${editingExp._id}`, payload);
      setShowEdit(false);
      setEditingExp(null);
      fetchExpenses();
    } catch (error) {
      alert('Error updating expense');
    }
  };

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Delete this expense? This cannot be undone.')) return;
    try {
      await apiClient.delete(`/api/expenses/${expenseId}`);
      fetchExpenses();
    } catch (error) {
      alert('Error deleting expense');
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
        {user?.role === 'MANAGER' && (
          <button onClick={() => setShowAdd(true)} className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-black">
            <Plus />
          </button>
        )}
      </div>

      <div className="px-6 flex gap-2 mb-3 overflow-x-auto no-scrollbar">
        {['LIST', 'MONTHLY'].map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode as 'LIST' | 'MONTHLY')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border ${
              viewMode === mode ? 'bg-primary border-primary text-black' : 'border-border text-neutral-500'
            }`}
          >
            {mode === 'LIST' ? 'Expenses' : 'Monthly Spend'}
          </button>
        ))}
      </div>

      {viewMode === 'LIST' && (
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
      )}

      {viewMode === 'LIST' ? (
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
              
              {user?.role === 'MANAGER' && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <button onClick={() => openEdit(exp)} className="flex-1 min-w-[120px] bg-white/5 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                  <button onClick={() => handleDelete(exp._id)} className="flex-1 min-w-[120px] bg-red-500/10 text-red-500 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                  {status === 'PENDING' && (
                    <>
                  <button onClick={() => handleAction(exp._id, 'APPROVED')} className="flex-1 bg-primary/20 text-primary py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => handleAction(exp._id, 'REJECTED')} className="flex-1 bg-red-500/10 text-red-500 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                    <X className="w-4 h-4" /> Reject
                  </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="px-6 space-y-4">
          {loading ? <p className="text-center text-primary">Loading...</p> :
           monthlyTotals.length === 0 ? <p className="text-center text-neutral-500 py-10">No approved expenses yet.</p> :
           monthlyTotals.map((month) => (
            <div key={month.monthKey} className="glass-card p-4 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold">{month.label}</p>
                  <p className="text-xs text-neutral-500">{month.count} expenses</p>
                </div>
                <p className="text-xl font-bold text-primary">₹{month.total.toFixed(0)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

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

      {showEdit && editingExp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-6">Edit Expense</h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <input 
                type="number" 
                placeholder="Amount" 
                className="w-full bg-neutral-900 border border-border rounded-lg p-3"
                value={editExp.amount}
                onChange={e => setEditExp({...editExp, amount: e.target.value})}
                required
              />
              {user?.role === 'MANAGER' && (
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Spent By</label>
                  <select 
                    className="w-full bg-neutral-900 border border-border rounded-lg p-3 text-sm"
                    value={editExp.spentBy}
                    onChange={e => setEditExp({...editExp, spentBy: e.target.value})}
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
                value={editExp.description}
                onChange={e => setEditExp({...editExp, description: e.target.value})}
                required
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowEdit(false); setEditingExp(null); }} className="flex-1 py-3 text-neutral-500">Cancel</button>
                <button type="submit" className="flex-1 btn-primary py-3">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
