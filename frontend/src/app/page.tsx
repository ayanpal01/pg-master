"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChefHat,
  Utensils,
  IndianRupee,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle,
  Zap,
  Menu,
  X,
} from 'lucide-react';


const features = [
  {
    icon: Utensils,
    title: 'One-Click Meal Toggle',
    desc: 'Mark lunch or dinner in seconds — from your phone, anywhere. No paper ledgers, no WhatsApp chaos.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  {
    icon: IndianRupee,
    title: 'Smart Expense Tracking',
    desc: 'Every rupee logged, categorised, and visible to all members. Managers add expenses; the math is automatic.',
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
  },
  {
    icon: BarChart3,
    title: 'Live Analytics',
    desc: 'Area charts, daily meal trends, and month-end summaries. Know exactly where the money goes — at a glance.',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10',
    border: 'border-orange-400/20',
  },
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    desc: 'httpOnly session cookies, JWT encryption, role-based access, and security headers on every response.',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
    border: 'border-violet-400/20',
  },
];

const steps = [
  { num: '01', title: 'Manager creates a PG', desc: 'Set up your mess in minutes — add meal types, invite members, and set cooking charges.' },
  { num: '02', title: 'Members toggle meals daily', desc: 'Each resident marks their own lunch or dinner. The manager sees a real-time attendance dashboard.' },
  { num: '03', title: 'Auto settlement at month-end', desc: 'The system calculates each member\'s share. Balances carry forward automatically.' },
];

const stats = [
  { value: '100%', label: 'Transparent billing' },
  { value: '0', label: 'Manual calculations' },
  { value: '24h', label: 'Session security' },
  { value: '∞', label: 'Members supported' },
];

function AnimatedCounter({ target, suffix = '' }: { target: string; suffix?: string }) {
  return <span>{target}{suffix}</span>;
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E6EDF3] overflow-x-hidden">
      {/* Ambient blobs */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-accent/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[120px]" />
      </div>

      {/* ─── Navbar ──────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#0B0F14]/90 backdrop-blur-xl border-b border-[#1F2937]' : ''
      }`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <ChefHat className="text-black" size={16} />
            </div>
            <span className="text-base font-black tracking-tight uppercase italic text-white">PG Master</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-[#9DA7B3] hover:text-white transition-colors font-medium">Features</a>
            <a href="#how" className="text-sm text-[#9DA7B3] hover:text-white transition-colors font-medium">How it works</a>
            <a href="#security" className="text-sm text-[#9DA7B3] hover:text-white transition-colors font-medium">Security</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-[#9DA7B3] hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link href="/setup-pg" className="text-sm font-bold bg-primary text-black px-4 py-2 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 active:scale-95">
              Get Started Free
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-[#9DA7B3] hover:text-white transition-colors">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-[#11161D] border-t border-[#1F2937] px-6 py-4 space-y-4">
            <a href="#features" onClick={() => setMenuOpen(false)} className="block text-sm text-[#9DA7B3]">Features</a>
            <a href="#how" onClick={() => setMenuOpen(false)} className="block text-sm text-[#9DA7B3]">How it works</a>
            <a href="#security" onClick={() => setMenuOpen(false)} className="block text-sm text-[#9DA7B3]">Security</a>
            <div className="pt-2 border-t border-[#1F2937] flex flex-col gap-3">
              <Link href="/login" className="text-sm font-semibold text-[#9DA7B3] py-2">Sign In</Link>
              <Link href="/setup-pg" className="text-sm font-bold bg-primary text-black px-4 py-2.5 rounded-xl text-center">Get Started Free</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-8">
          <Zap size={12} className="fill-primary" />
          The smartest way to manage your PG mess
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] mb-6 max-w-4xl mx-auto">
          <span className="text-white">Your PG meals,</span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent">
            perfectly tracked.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-[#9DA7B3] max-w-xl mx-auto mb-10 leading-relaxed">
          PG Master replaces WhatsApp chaos and paper ledgers with a real-time dashboard for meals, expenses, and member balances — built for modern PGs.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/setup-pg" className="group flex items-center gap-2 bg-primary text-black font-bold text-sm px-7 py-3.5 rounded-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 active:scale-95 w-full sm:w-auto justify-center">
            Create your PG — it&apos;s free
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/login" className="flex items-center gap-2 bg-[#11161D] border border-[#1F2937] text-[#E6EDF3] font-bold text-sm px-7 py-3.5 rounded-xl hover:bg-[#1A2129] transition-all w-full sm:w-auto justify-center">
            Member? Sign in
          </Link>
        </div>

        {/* Dashboard mockup */}
        <div className="relative max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14] via-transparent to-transparent z-10 pointer-events-none h-full top-auto bottom-0 h-32" style={{top: 'auto', height: '8rem'}} />
          <div className="bg-[#11161D] border border-[#1F2937] rounded-2xl overflow-hidden shadow-2xl shadow-black/60 p-4 sm:p-6">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-primary/50" />
              <div className="ml-3 flex-1 bg-[#0B0F14] rounded-lg px-3 py-1.5 text-[10px] text-[#9DA7B3] text-left font-mono">
                pgmaster.app/dashboard
              </div>
            </div>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Monthly Spend', value: '₹12,450', color: 'text-orange-400' },
                { label: 'Total Meals', value: '248', color: 'text-white' },
                { label: 'Cash on Hand', value: '₹3,200', color: 'text-primary' },
                { label: 'Members', value: '8', color: 'text-accent' },
              ].map((s) => (
                <div key={s.label} className="bg-[#0B0F14] rounded-xl p-3 border border-[#1F2937]">
                  <p className="text-[9px] uppercase tracking-widest text-[#9DA7B3] font-bold mb-1">{s.label}</p>
                  <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            {/* Chart placeholder */}
            <div className="bg-[#0B0F14] rounded-xl border border-[#1F2937] h-28 sm:h-40 flex items-end px-4 pb-3 gap-1 overflow-hidden">
              {[40,60,35,80,50,90,45,70,55,85,65,75,30,95].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col gap-0.5 justify-end">
                  <div className="rounded-sm bg-primary/60 hover:bg-primary transition-all" style={{ height: `${h}%` }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats bar ───────────────────────────────────────────── */}
      <section className="px-6 py-12 border-y border-[#1F2937]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-black text-white mb-1">
                <AnimatedCounter target={s.value} />
              </p>
              <p className="text-xs font-bold uppercase tracking-widest text-[#9DA7B3]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────── */}
      <section id="features" className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary mb-4">Why PG Master</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Everything your mess needs</h2>
            <p className="text-[#9DA7B3] max-w-lg mx-auto text-sm leading-relaxed">
              Designed for both managers and members — transparent, fast, and beautifully simple.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div key={f.title} className={`bg-[#11161D] p-6 rounded-2xl border ${f.border} hover:border-opacity-60 transition-all duration-300 hover:-translate-y-1 group`}>
                <div className={`inline-flex p-3 rounded-xl ${f.bg} ${f.color} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon size={22} />
                </div>
                <h3 className="text-sm font-black text-white mb-2">{f.title}</h3>
                <p className="text-xs text-[#9DA7B3] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────── */}
      <section id="how" className="px-6 py-24 bg-[#11161D]/40">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent mb-4">Get started in minutes</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">How it works</h2>
          </div>

          <div className="space-y-6">
            {steps.map((step, i) => (
              <div key={step.num} className="flex gap-6 p-6 bg-[#11161D] rounded-2xl border border-[#1F2937] hover:border-[#2D3748] transition-all">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <span className="text-xs font-black text-accent">{step.num}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-white mb-1">{step.title}</h3>
                  <p className="text-sm text-[#9DA7B3] leading-relaxed">{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden sm:block flex-shrink-0 self-center text-[#1F2937]">
                    <ArrowRight size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Security section ─────────────────────────────────────── */}
      <section id="security" className="px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-400 mb-4">Built to be trusted</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-6 leading-tight">
                Your data stays <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-accent">private & protected</span>
              </h2>
              <p className="text-[#9DA7B3] text-sm leading-relaxed mb-8">
                PG Master was built with security-first design. Every request is authenticated; your API data is never accessible from outside.
              </p>
              <ul className="space-y-4">
                {[
                  'JWT sessions in httpOnly cookies — JavaScript cannot read them',
                  'Role-based access control (Manager vs. Member)',
                  'All routes protected by server-side middleware',
                  'CORS lockdown — API cannot be called from external sites',
                  'Security headers on every response (CSP, X-Frame-Options, HSTS)',
                  '24-hour session expiry with automatic invalidation',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#9DA7B3]">
                    <CheckCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              {[
                { label: 'httpOnly Cookie Session', status: 'Protected', color: 'text-primary bg-primary/10 border-primary/20' },
                { label: 'API Route Auth Guard', status: 'Active', color: 'text-primary bg-primary/10 border-primary/20' },
                { label: 'Content Security Policy', status: 'Enforced', color: 'text-accent bg-accent/10 border-accent/20' },
                { label: 'HSTS / Secure Transport', status: 'Enabled', color: 'text-accent bg-accent/10 border-accent/20' },
                { label: 'External API Access', status: 'Blocked', color: 'text-red-500 bg-red-500/10 border-red-500/20' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between p-4 bg-[#11161D] rounded-xl border border-[#1F2937]">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-current opacity-60" style={{ color: row.color.includes('red') ? '#ef4444' : row.color.includes('accent') ? '#06B6D4' : '#22C55E' }} />
                    <span className="text-sm font-medium text-[#9DA7B3]">{row.label}</span>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full border ${row.color}`}>
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-primary/10 via-[#11161D] to-accent/10 border border-[#1F2937] rounded-3xl p-8 sm:p-16">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30">
              <ChefHat className="text-black" size={28} />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to modernise your PG?</h2>
            <p className="text-[#9DA7B3] text-sm mb-8 max-w-md mx-auto leading-relaxed">
              Set up your mess in under 5 minutes. Invite your members, and start tracking meals on day one.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/setup-pg" className="group flex items-center justify-center gap-2 bg-primary text-black font-bold text-sm px-8 py-4 rounded-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 active:scale-95 w-full sm:w-auto">
                Create your PG — free
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/login" className="text-sm font-semibold text-[#9DA7B3] hover:text-white transition-colors underline underline-offset-4">
                Already have an account?
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-[#1F2937] px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <ChefHat className="text-black" size={14} />
            </div>
            <span className="text-sm font-black tracking-tight uppercase italic text-white">PG Master</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#9DA7B3]">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#security" className="hover:text-white transition-colors">Security</a>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>

          <p className="text-xs text-[#9DA7B3]/50 text-center sm:text-right">
            © {new Date().getFullYear()} PG Master. Built for modern living.
          </p>
        </div>
      </footer>
    </div>
  );
}
