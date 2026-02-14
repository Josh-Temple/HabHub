'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { consistency, currentStreak, last7days } from '@/lib/domain/analysis';
import { Entry, Habit } from '@/types/domain';

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

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Analysis</h1>
      <p>Consistency (30d): {c}%</p>
      <p>Current Streak: {streak}</p>
      <div>
        <h2 className="font-medium">Last 7 Days</h2>
        {bars.map((b) => <div key={b.date} className="flex gap-2 items-center"><span className="w-24 text-sm">{b.date.slice(5)}</span><div className="h-3 bg-slate-300" style={{ width: `${b.rate * 2}px` }} /></div>)}
      </div>
      <div>
        <h2 className="font-medium">Heatmap (rough)</h2>
        <div className="grid grid-cols-20 gap-1">
          {entries.slice(0, 80).map((e, i) => <div key={`${e.date_key}-${i}`} className={`h-4 w-4 ${e.count >= 5 ? 'bg-emerald-700' : e.count >= 3 ? 'bg-emerald-500' : e.count >= 1 ? 'bg-emerald-300' : 'bg-slate-200'}`} title={`${e.date_key}: ${e.count}`} />)}
        </div>
      </div>
    </div>
  );
}
