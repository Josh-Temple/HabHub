'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { buildHabitReorderPlan } from '@/lib/habits/reorder';
import { Habit } from '@/types/domain';

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const load = async () => {
    const supabase = createClient();
    const { data } = await supabase.from('habits').select('*').order('sort_order', { ascending: true });
    setHabits((data ?? []) as Habit[]);
  };

  const active = useMemo(() => habits.filter((h) => !h.archived), [habits]);

  const move = async (habit: Habit, dir: -1 | 1) => {
    if (isSavingOrder) return;

    const plan = buildHabitReorderPlan(active, habit.id, dir);
    if (!plan) return;

    setOrderError(null);
    setIsSavingOrder(true);

    try {
      const supabase = createClient();
      const results = await Promise.all(
        plan.updates.map((update) => supabase.from('habits').update({ sort_order: update.sort_order }).eq('id', update.id))
      );

      const failed = results.find((result) => result.error);
      if (failed?.error) {
        setOrderError('並び順の保存に失敗しました。時間をおいてもう一度お試しください。');
      }

      await load();
    } finally {
      setIsSavingOrder(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-7">
      <section>
        <p className="micro-label">Management</p>
        <h1 className="mt-3 text-4xl font-black leading-[0.95] tracking-tighter sm:text-6xl">Inventory</h1>
      </section>

      {orderError && <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{orderError}</p>}

      <div className="space-y-3 sm:space-y-4">
        {active.map((h, index) => (
          <div key={h.id} className="flex items-center gap-3 rounded-3xl border border-[#ebebeb] bg-white p-3.5 sm:gap-4 sm:p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f5f5f7] text-xl sm:h-16 sm:w-16 sm:text-2xl">•</div>
            <div className="min-w-0 flex-1">
              <Link href={`/app/habits/${h.id}`} className="block truncate text-lg font-black tracking-tight sm:text-xl">{h.name}</Link>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#b8b8be] sm:tracking-[0.35em]">{h.frequency.replace('_', ' ')} ・ {h.goal_count} time</p>
            </div>
            <div className="grid w-11 gap-1 rounded-2xl bg-[#f8f8fa] p-1 sm:w-12">
              <button disabled={isSavingOrder || index === 0} onClick={() => void move(h, -1)} className="tap-active rounded-xl py-1 text-[#888] disabled:cursor-not-allowed disabled:opacity-40">▲</button>
              <button disabled={isSavingOrder || index === active.length - 1} onClick={() => void move(h, 1)} className="tap-active rounded-xl py-1 text-[#888] disabled:cursor-not-allowed disabled:opacity-40">▼</button>
            </div>
          </div>
        ))}
      </div>
      <p className="pt-6 text-center text-xs font-black uppercase tracking-[0.45em] text-[#ebebeb]">End of Inventory</p>
    </div>
  );
}
