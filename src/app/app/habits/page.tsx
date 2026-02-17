'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { buildHabitReorderPlan } from '@/lib/habits/reorder';
import { Habit } from '@/types/domain';

const ORDER_ERROR_MESSAGE = '並び順の保存に失敗しました。時間をおいてもう一度お試しください。';

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const load = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('habits')
      .select('*')
      .order('sort_order', { ascending: true });

    setHabits((data ?? []) as Habit[]);
  };

  const activeHabits = useMemo(() => habits.filter((habit) => !habit.archived), [habits]);

  const move = async (habit: Habit, direction: -1 | 1) => {
    if (isSavingOrder) return;

    const plan = buildHabitReorderPlan(activeHabits, habit.id, direction);
    if (!plan) return;

    setOrderError(null);
    setIsSavingOrder(true);

    try {
      const supabase = createClient();
      const results = await Promise.all(
        plan.updates.map((update) =>
          supabase
            .from('habits')
            .update({ sort_order: update.sort_order })
            .eq('id', update.id)
        )
      );

      const failed = results.find((result) => result.error);
      if (failed?.error) {
        setOrderError(ORDER_ERROR_MESSAGE);
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
        <p className="micro-label">管理</p>
        <h1 className="mt-3 text-4xl font-black leading-[0.95] tracking-tighter sm:text-6xl">
          習慣一覧
        </h1>
      </section>

      {orderError && (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          {orderError}
        </p>
      )}

      <div className="space-y-3 sm:space-y-4">
        {activeHabits.map((habit, index) => {
          const accentColor = habit.schedule?.accentColor ?? '#111111';
          const isFirst = index === 0;
          const isLast = index === activeHabits.length - 1;
          const disableUp = isSavingOrder || isFirst;
          const disableDown = isSavingOrder || isLast;

          return (
            <div
              key={habit.id}
              className="flex items-center gap-3 rounded-3xl border border-[#ebebeb] bg-white p-3.5 sm:gap-4 sm:p-4"
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f5f5f7] text-xl sm:h-16 sm:w-16 sm:text-2xl"
                style={{ color: accentColor }}
              >
                •
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/app/habits/${habit.id}`}
                  className="block truncate text-lg font-black tracking-tight sm:text-xl"
                >
                  {habit.name}
                </Link>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#b8b8be] sm:tracking-[0.35em]">
                  {habit.frequency.replace('_', ' ')} ・ {habit.goal_count} time
                </p>
              </div>

              <div className="grid w-11 gap-1 rounded-2xl bg-[#f8f8fa] p-1 sm:w-12">
                <button
                  disabled={disableUp}
                  onClick={() => void move(habit, -1)}
                  className="tap-active rounded-xl py-1 text-[#888] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ▲
                </button>
                <button
                  disabled={disableDown}
                  onClick={() => void move(habit, 1)}
                  className="tap-active rounded-xl py-1 text-[#888] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ▼
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="pt-6 text-center text-xs font-black uppercase tracking-[0.45em] text-[#ebebeb]">
        一覧の終わり
      </p>
    </div>
  );
}
