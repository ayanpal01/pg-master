"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';

export default function SetupPG() {
  const [pgName, setPgName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mealTypes, setMealTypes] = useState(['Breakfast', 'Lunch', 'Dinner']);
  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const { refreshProfile } = useAuth();
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient.post('/api/setup', { 
        name: pgName, 
        mealTypes,
        managerName,
        phoneNumber
      });
      
      setGeneratedKey(res.data.managerKey);
      // Wait for profile refresh to ensure cookie is processed
      await refreshProfile();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || 'Error creating PG');
    } finally {
      setLoading(false);
    }
  };

  const toggleMeal = (meal: string) => {
    if (mealTypes.includes(meal)) {
      setMealTypes(mealTypes.filter(m => m !== meal));
    } else {
      setMealTypes([...mealTypes, meal]);
    }
  };

  if (generatedKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="glass-card w-full max-w-lg p-8 space-y-8 text-center">
          <div className="bg-primary/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-primary text-3xl">✓</span>
          </div>
          <h1 className="text-3xl font-bold text-white">PG Created Successfully!</h1>
          <p className="text-muted-foreground">This is your manager access key. **Save it carefully**, you will need it to login.</p>
          
          <div className="p-6 bg-neutral-900 border border-primary/50 rounded-2xl">
            <p className="text-sm text-primary mb-2 font-bold uppercase tracking-widest">Your Unique Key</p>
            <p className="text-4xl font-mono font-bold text-white tracking-widest">{generatedKey}</p>
          </div>

          <button 
            onClick={() => router.push('/dashboard')}
            className="btn-primary w-full py-4 text-lg font-bold"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="glass-card w-full max-w-lg p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Launch your PG</h1>
          <p className="text-muted-foreground mt-2">Manage meals and expenses like a pro.</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">Admin/Manager Name</label>
              <input 
                type="text" 
                required
                className="w-full bg-neutral-900 border border-border rounded-lg p-3"
                placeholder="Anya Singh"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">Phone Number (Unique)</label>
              <input 
                type="tel" 
                required
                className="w-full bg-neutral-900 border border-border rounded-lg p-3"
                placeholder="+91 9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-muted-foreground">PG Name</label>
              <input 
                type="text" 
                required
                className="w-full bg-neutral-900 border border-border rounded-lg p-3"
                placeholder="Modern Boys PG"
                value={pgName}
                onChange={(e) => setPgName(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-4 text-muted-foreground">Select Default Meal Types</label>
            <div className="flex flex-wrap gap-3">
              {['Breakfast', 'Lunch', 'Dinner', 'Evening Snacks'].map(meal => (
                <button
                  key={meal}
                  type="button"
                  onClick={() => toggleMeal(meal)}
                  className={`px-4 py-2 rounded-full border transition-all ${
                    mealTypes.includes(meal) 
                      ? 'bg-primary/20 border-primary text-primary' 
                      : 'border-border text-neutral-400'
                  }`}
                >
                  {meal}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || mealTypes.length === 0}
            className="btn-primary w-full py-4 text-lg font-bold"
          >
            {loading ? 'Creating...' : 'Initialize PG'}
          </button>
        </form>
      </div>
    </div>
  );
}
