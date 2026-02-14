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

  useEffect(() => { void load(); }, []);

  return (
    <div className="space-y-3">
      <Link href="/app/habits/new">+ New Habit</Link>
      {habits.filter((h) => !h.archived).map((h) => (
        <div key={h.id} className="border p-3 rounded flex gap-2 items-center">
          <Link href={`/app/habits/${h.id}`} className="font-medium">{h.name}</Link>
          <button onClick={() => move(h, -1)}>↑</button>
          <button onClick={() => move(h, 1)}>↓</button>
        </div>
      ))}
    </div>
  );
}
