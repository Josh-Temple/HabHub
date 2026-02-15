'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { isHabitDue } from '@/lib/domain/isHabitDue';
import { toDateKey } from '@/lib/domain/date';
import { Entry, Habit, UserSettings } from '@/types/domain';

function ProgressRing({ progress, done }: { progress: number; done: boolean }) {
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="tap-active">
      <circle cx="20" cy="20" r={radius} fill="none" stroke="#EBEBEB" strokeWidth="3" />
      <circle
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        stroke={done ? '#111111' : '#888888'}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 20 20)"
      />
      {done && <text x="20" y="24" textAnchor="middle" className="fill-black text-[12px]">✓</text>}
    </svg>
  );
}

export default function TodayPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [settings, setSettings] = useState<UserSettings>({ user_id: '', week_start: 1, migration_done: false });
  const today = toDateKey(new Date());

  const load = async () => {
    const supabase = createClient();
    const [{ data: hs }, { data: es }, { data: s }, { data: u }] = await Promise.all([
      supabase.from('habits').select('*').order('sort_order'),
      supabase.from('entries').select('*').gte('date_key', new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString().slice(0, 10)),
      supabase.from('user_settings').select('*').single(),
      supabase.auth.getUser()
    ]);
    setHabits((hs ?? []) as Habit[]);
    setEntries((es ?? []) as Entry[]);
    if (s) setSettings(s as UserSettings);
    else if (u.user) {
      const { data } = await supabase
        .from('user_settings')
        .upsert({ user_id: u.user.id, week_start: 1 }, { onConflict: 'user_id' })
        .select('*')
        .single();
      setSettings(data as UserSettings);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const dueHabits = useMemo(() => habits.filter((h) => isHabitDue(h, today, entries, settings)), [habits, entries, settings, today]);
  const routineHabits = dueHabits.filter((h) => h.frequency !== 'once');
  const oneOffHabits = dueHabits.filter((h) => h.frequency === 'once');

  const bump = async (habit: Habit, delta: number) => {
    const current = entries.find((e) => e.habit_id === habit.id && e.date_key === today);
    const count = Math.max(0, (current?.count ?? 0) + delta);
    const completed = count >= habit.goal_count;
    await createClient().from('entries').upsert({ habit_id: habit.id, date_key: today, count, completed }, { onConflict: 'user_id,habit_id,date_key' });
    await load();
  };

  const toggleDone = async (habit: Habit) => {
    const current = entries.find((e) => e.habit_id === habit.id && e.date_key === today);
    const targetCount = current?.completed ? 0 : habit.goal_count;
    await createClient().from('entries').upsert(
      { habit_id: habit.id, date_key: today, count: targetCount, completed: !current?.completed },
      { onConflict: 'user_id,habit_id,date_key' }
    );
    await load();
  };

  const completedCount = dueHabits.filter((h) => {
    const e = entries.find((en) => en.habit_id === h.id && en.date_key === today);
    return (e?.count ?? 0) >= h.goal_count;
  }).length;

  const HabitRow = ({ habit }: { habit: Habit }) => {
    const e = entries.find((en) => en.habit_id === habit.id && en.date_key === today);
    const count = e?.count ?? 0;
    const done = count >= habit.goal_count;
    const progress = Math.min(1, count / habit.goal_count);

    return (
      <div className="border-b border-[#ebebeb] py-5 sm:py-6">
        <div className="flex items-start justify-between gap-3 sm:items-center sm:gap-4">
          <button className="tap-active text-left" onClick={() => void bump(habit, 1)}>
            <p className={`text-lg font-black leading-tight tracking-tight sm:text-xl ${done ? 'opacity-40 line-through' : ''}`}>{habit.name}</p>
            <p className="mt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#888] sm:tracking-[0.4em]">
              <span className={`h-2 w-2 rounded-full ${done ? 'bg-black' : 'bg-[#888]'}`} />
              {habit.frequency === 'flexible' ? `Weekly Goal: ${count} / ${habit.goal_count}` : `${count} / ${habit.goal_count} completed`}
            </p>
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {habit.external_url && (
              <a href={habit.external_url} target="_blank" rel="noreferrer" className="text-[#888] tap-active">
                ↗
              </a>
            )}
            <button onClick={() => void toggleDone(habit)}>
              <ProgressRing progress={progress} done={done} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-7 sm:space-y-8">
      <section>
        <p className="micro-label">Daily Snapshot</p>
        <h1 className="mt-3 text-4xl font-black leading-[0.95] tracking-tighter sm:text-6xl">Current Focus</h1>
      </section>

      <section className="border-y border-[#ebebeb] py-5 sm:py-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <p className="text-5xl font-black leading-none tracking-tighter sm:text-6xl">
            {String(completedCount).padStart(2, '0')}
            <span className="ml-1 text-3xl text-[#d1d1d4] sm:ml-2 sm:text-4xl">/{String(dueHabits.length).padStart(2, '0')}</span>
          </p>
          <div className="h-12 w-px bg-[#ebebeb] sm:h-14" />
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-black sm:tracking-[0.5em]">Completed<br /><span className="text-[#bcbcc0]">Today's Progress</span></p>
        </div>
      </section>

      {dueHabits.length === 0 && <p className="py-16 text-center text-lg font-bold text-[#888] sm:py-24 sm:text-xl">Nothing Scheduled</p>}

      {routineHabits.length > 0 && (
        <section>
          <p className="micro-label">Routine</p>
          <div className="mt-2 sm:mt-3">{routineHabits.map((h) => <HabitRow key={h.id} habit={h} />)}</div>
        </section>
      )}

      {oneOffHabits.length > 0 && (
        <section>
          <p className="micro-label">One-off Tasks</p>
          <div className="mt-2 sm:mt-3">{oneOffHabits.map((h) => <HabitRow key={h.id} habit={h} />)}</div>
        </section>
      )}
    </div>
  );
}
