"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const [uniqueKey, setUniqueKey] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  useEffect(() => {
    if (user) {
      router.push(user.pgId ? '/dashboard' : '/setup-pg');
    }
  }, [user, router]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiClient.post('/api/auth/login', { uniqueKey: uniqueKey.trim() });
      const userData = response.data;
      
      // Wait for profile refresh to ensure cookie is processed
      await refreshProfile();
      
      // Navigate based on user data
      if (userData.pgId) {
        router.push('/dashboard');
      } else {
        router.push('/setup-pg');
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || 'Login failed. Please check your key.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="glass-card w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">PG Master</h1>
          <p className="text-muted-foreground mt-2">Sustainable Meal & Expense Management</p>
        </div>

        <form onSubmit={onLogin} className="space-y-4">
          <div className="mb-2 text-center p-3 bg-primary/10 rounded-lg">
            <p className="text-xs text-primary font-medium">Use the Unique Key provided by your Manager</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-muted-foreground">Unique Access Key</label>
            <input 
              type="text" 
              required
              className="w-full bg-neutral-900 border border-border rounded-lg p-3 text-center text-xl tracking-wider font-mono placeholder:tracking-normal placeholder:font-sans"
              placeholder="PG-XXXX-XXXX"
              value={uniqueKey}
              onChange={(e) => setUniqueKey(e.target.value.toUpperCase())}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full py-4 text-lg font-bold"
          >
            {loading ? 'Entering...' : 'Login Now'}
          </button>
          
          <div className="pt-4 border-t border-border/50 text-center">
            <p className="text-sm text-muted-foreground">Don't have a PG or Key?</p>
            <button 
              type="button"
              onClick={() => router.push('/setup-pg')}
              className="text-primary font-bold mt-1 hover:underline"
            >
              Set up a new PG
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
