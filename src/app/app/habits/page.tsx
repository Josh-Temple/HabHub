'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { Habit } from '@/types/domain';

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);

  const load = async () => {
    const supabase = createClient();
    const { data } = await supabase.from('habits').select('*').order('sort_order', { ascending: true });
    setHabits((data ?? []) as Habit[]);
  };

  const move = async (habit: Habit, dir: -1 | 1) => {
    await createClient().from('habits').update({ sort_order: habit.sort_order + dir }).eq('id', habit.id);
    await load();
  };

  useEffect(() => {
    void load();
  }, []);

  const active = habits.filter((h) => !h.archived);

  return (
    <div className="space-y-6 sm:space-y-7">
      <section>
        <p className="micro-label">Management</p>
        <h1 className="mt-3 text-4xl font-black leading-[0.95] tracking-tighter sm:text-6xl">Inventory</h1>
      </section>

      <div className="space-y-3 sm:space-y-4">
        {active.map((h) => (
          <div key={h.id} className="flex items-center gap-3 rounded-3xl border border-[#ebebeb] bg-white p-3.5 sm:gap-4 sm:p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f5f5f7] text-xl sm:h-16 sm:w-16 sm:text-2xl">•</div>
            <div className="min-w-0 flex-1">
              <Link href={`/app/habits/${h.id}`} className="block truncate text-lg font-black tracking-tight sm:text-xl">{h.name}</Link>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#b8b8be] sm:tracking-[0.35em]">{h.frequency.replace('_', ' ')} ・ {h.goal_count} time</p>
            </div>
            <div className="grid w-11 gap-1 rounded-2xl bg-[#f8f8fa] p-1 sm:w-12">
              <button onClick={() => void move(h, -1)} className="tap-active rounded-xl py-1 text-[#888]">▲</button>
              <button onClick={() => void move(h, 1)} className="tap-active rounded-xl py-1 text-[#888]">▼</button>
            </div>
          </div>
        ))}
      </div>
      <p className="pt-6 text-center text-xs font-black uppercase tracking-[0.45em] text-[#ebebeb]">End of Inventory</p>
    </div>
  );
}
