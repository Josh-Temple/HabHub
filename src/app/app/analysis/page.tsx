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
    <div className="space-y-9">
      <section>
        <p className="micro-label">Deep Insights</p>
        <h1 className="mt-3 text-6xl font-black leading-none tracking-tighter">Analysis</h1>
      </section>

      <section className="flex justify-between border-b border-[#ebebeb] pb-9">
        <div>
          <p className="text-7xl font-black leading-none tracking-tight">{c}%</p>
          <p className="micro-label mt-4">Consistency (30d)</p>
        </div>
        <div className="text-right">
          <p className="text-7xl font-black leading-none tracking-tight">{streak}</p>
          <p className="micro-label mt-4">Day Streak</p>
        </div>
      </section>

      <section className="rounded-3xl border border-[#ebebeb] p-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="micro-label text-[#888]">Activity Map</p>
            <p className="text-4xl font-black tracking-tight text-2xl">Momentum</p>
          </div>
          <p className="micro-label text-[#b8b8be]">120d History</p>
        </div>
        <div className="grid grid-rows-7 grid-flow-col gap-2">
          {heat.map((level, idx) => (
            <div key={idx} className="h-4 w-4 rounded-[4px]" style={{ backgroundColor: tones[level] }} />
          ))}
        </div>
        <div className="mt-8 border-t border-[#ebebeb] pt-6 flex items-center justify-center gap-3">
          {tones.map((tone) => <span key={tone} className="h-4 w-4 rounded-[4px]" style={{ backgroundColor: tone }} />)}
          <span className="ml-3 micro-label text-[#888]">Peak</span>
        </div>
      </section>

      <section>
        <p className="micro-label mb-3">Last 7 Days</p>
        <div className="flex h-32 items-end gap-3">
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
