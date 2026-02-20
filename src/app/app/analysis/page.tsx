'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { consistency, currentStreak, last7days } from '@/lib/domain/analysis';
import { Entry, Habit } from '@/types/domain';

const tones = ['#eef0f4', '#d7dce4', '#b2bac8', '#7d8798', '#000000'];

export default function AnalysisPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    Promise.all([
      createClient().from('entries').select('*').order('date_key', { ascending: false }).limit(180),
      createClient().from('habits').select('*')
    ]).then(([e, h]) => {
      setEntries((e.data ?? []) as Entry[]);
      setHabits((h.data ?? []) as Habit[]);
    });
  }, []);

  const c = consistency(entries, habits);
  const streak = currentStreak(entries);
  const bars = last7days(entries);

  const heat = useMemo(() => {
    const points = entries.slice(0, 119).map((e) => {
      if (e.count === 0) return 0;
      if (e.count === 1) return 1;
      if (e.count <= 3) return 2;
      if (e.count <= 5) return 3;
      return 4;
    });
    return [...Array(119 - points.length).fill(0), ...points];
  }, [entries]);

  return (
    <div className="space-y-7 sm:space-y-9">
      <section>
        <p className="micro-label">Analytics insight</p>
        <h1 className="mt-3 text-4xl font-black leading-[0.95] tracking-tighter sm:text-6xl">Analysis</h1>
      </section>

      <section className="flex items-end justify-between gap-5 border-b border-[#ebebeb] pb-7 sm:pb-9">
        <div>
          <p className="text-5xl font-black leading-none tracking-tight sm:text-7xl">{c}%</p>
          <p className="micro-label mt-4">Consistency (30 days)</p>
        </div>
        <div className="text-right">
          <p className="text-5xl font-black leading-none tracking-tight sm:text-7xl">{streak}</p>
          <p className="micro-label mt-4">Current streak</p>
        </div>
      </section>

      <section className="rounded-3xl border border-[#ebebeb] p-4 sm:p-8">
        <div className="mb-4 flex items-end justify-between sm:mb-6">
          <div>
            <p className="micro-label text-[#888]">Activity map</p>
            <p className="text-2xl font-black tracking-tight sm:text-4xl">Momentum</p>
          </div>
          <p className="micro-label text-[#b8b8be]">120-day history</p>
        </div>
        <div className="grid grid-flow-col grid-rows-7 gap-1.5 sm:gap-2">
          {heat.map((level, idx) => (
            <div key={idx} className="h-3.5 w-3.5 rounded-[4px] sm:h-4 sm:w-4" style={{ backgroundColor: tones[level] }} />
          ))}
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 border-t border-[#ebebeb] pt-5 sm:mt-8 sm:gap-3 sm:pt-6">
          {tones.map((tone) => <span key={tone} className="h-3.5 w-3.5 rounded-[4px] sm:h-4 sm:w-4" style={{ backgroundColor: tone }} />)}
          <span className="ml-3 micro-label text-[#888]">High</span>
        </div>
      </section>

      <section>
        <p className="micro-label mb-3">Last 7 days</p>
        <div className="flex h-28 items-end gap-2 sm:h-32 sm:gap-3">
          {bars.map((b) => (
            <div key={b.date} className="group flex-1 text-center">
              <div className="mx-auto w-2 rounded-full bg-[#111111] transition-all group-hover:w-3" style={{ height: `${Math.max(6, b.rate)}%` }} />
              <p className="mt-2 text-[10px] font-black tracking-[0.2em] text-[#888]">{b.date.slice(8)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
