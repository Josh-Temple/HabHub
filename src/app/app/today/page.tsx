'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { isHabitDue } from '@/lib/domain/isHabitDue';
import { toDateKey } from '@/lib/domain/date';
import { Entry, Habit, UserSettings } from '@/types/domain';

export default function TodayPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [settings, setSettings] = useState<UserSettings>({ user_id: '', week_start: 1, migration_done: false });
  const today = toDateKey(new Date());

  const load = async () => {
    const supabase = createClient();
    const [{ data: hs }, { data: es }, { data: s }, { data: u }] = await Promise.all([
      supabase.from('habits').select('*').order('sort_order'),
      supabase.from('entries').select('*').gte('date_key', new Date(Date.now()-1000*60*60*24*120).toISOString().slice(0,10)),
      supabase.from('user_settings').select('*').single(),
      supabase.auth.getUser()
    ]);
    setHabits((hs ?? []) as Habit[]);
    setEntries((es ?? []) as Entry[]);
    if (s) setSettings(s as UserSettings);
    else if (u.user) {
      const { data } = await supabase.from('user_settings').upsert({ user_id: u.user.id, week_start: 1 }, { onConflict: 'user_id' }).select('*').single();
      setSettings(data as UserSettings);
    }
  };

  useEffect(() => { void load(); }, []);

  const dueHabits = useMemo(() => habits.filter((h) => isHabitDue(h, today, entries, settings)), [habits, entries, settings, today]);

  const bump = async (habit: Habit, delta: number) => {
    const current = entries.find((e) => e.habit_id === habit.id && e.date_key === today);
    const count = Math.max(0, (current?.count ?? 0) + delta);
    const completed = count >= habit.goal_count;
    await createClient().from('entries').upsert({ habit_id: habit.id, date_key: today, count, completed }, { onConflict: 'user_id,habit_id,date_key' });
    await load();
  };

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Today</h1>
      {dueHabits.map((h) => {
        const e = entries.find((en) => en.habit_id === h.id && en.date_key === today);
        return (
          <div key={h.id} className="border rounded p-3">
            <div className="flex justify-between">
              <strong>{h.name}</strong>
              {h.external_url && <a href={h.external_url} target="_blank" rel="noreferrer">↗</a>}
            </div>
            <p>{e?.count ?? 0} / {h.goal_count}</p>
            <div className="flex gap-2">
              <button onClick={() => bump(h, 1)}>+1</button>
              <button onClick={() => bump(h, -1)}>-1</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
