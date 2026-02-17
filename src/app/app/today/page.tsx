'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { writeEntryWithCompat } from '@/lib/supabase/entryWriteStrategy';
import { toDateKey } from '@/lib/domain/date';
import { isEntryDone, nextCountFromBump, nextCountFromToggle } from '@/lib/domain/entryProgress';
import { isHabitDue } from '@/lib/domain/isHabitDue';
import { Entry, Habit, UserSettings } from '@/types/domain';

function ProgressRing({ progress, done, accentColor }: { progress: number; done: boolean; accentColor: string }) {
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
        stroke={accentColor}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 20 20)"
      />
      {done && <text x="20" y="24" textAnchor="middle" className="text-[12px]" fill={accentColor}>✓</text>}
    </svg>
  );
}

export default function TodayPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [settings, setSettings] = useState<UserSettings>({ user_id: '', week_start: 1, migration_done: false });
  const [busyHabitId, setBusyHabitId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [retryTarget, setRetryTarget] = useState<{ habitId: string; count: number } | null>(null);
  const today = toDateKey(new Date());

  const entryMap = useMemo(
    () => new Map(entries.filter((entry) => entry.date_key === today).map((entry) => [entry.habit_id, entry])),
    [entries, today]
  );

  const load = async () => {
    const supabase = createClient();
    const [{ data: hs, error: habitsError }, { data: es, error: entriesError }, { data: s }, { data: u, error: userError }] = await Promise.all([
      supabase.from('habits').select('*').order('sort_order'),
      supabase.from('entries').select('*').gte('date_key', new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString().slice(0, 10)),
      supabase.from('user_settings').select('*').single(),
      supabase.auth.getUser(),
    ]);

    if (habitsError || entriesError || userError) {
      setErrorMessage('読み込みに失敗しました。再度お試しください。');
      return;
    }

    setHabits((hs ?? []) as Habit[]);
    setEntries((es ?? []) as Entry[]);

    if (s) {
      setSettings(s as UserSettings);
      return;
    }

    if (u.user) {
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

  const dueHabits = useMemo(() => habits.filter((habit) => isHabitDue(habit, today, entries, settings)), [habits, entries, settings, today]);
  const routineHabits = dueHabits.filter((habit) => habit.frequency !== 'once');
  const oneOffHabits = dueHabits.filter((habit) => habit.frequency === 'once');

  const applyOptimisticEntry = (habit: Habit, count: number) => {
    setEntries((previousEntries) => {
      let found = false;
      const nextEntries = previousEntries.map((entry) => {
        if (entry.habit_id !== habit.id || entry.date_key !== today) return entry;
        found = true;
        return {
          ...entry,
          count,
          completed: count >= habit.goal_count,
        };
      });

      if (found) return nextEntries;

      return [
        ...nextEntries,
        {
          user_id: settings.user_id,
          habit_id: habit.id,
          date_key: today,
          count,
          completed: count >= habit.goal_count,
        },
      ];
    });
  };

  const rollbackOptimisticEntry = (habit: Habit, previousEntry: Entry | undefined) => {
    setEntries((previousEntries) => {
      if (previousEntry) {
        let restored = false;
        const restoredEntries = previousEntries.map((entry) => {
          if (entry.habit_id !== habit.id || entry.date_key !== today) return entry;
          restored = true;
          return previousEntry;
        });
        if (restored) return restoredEntries;
        return [...restoredEntries, previousEntry];
      }

      return previousEntries.filter((entry) => !(entry.habit_id === habit.id && entry.date_key === today));
    });
  };

  const updateEntry = async (habit: Habit, count: number, previousEntry: Entry | undefined) => {
    const supabase = createClient();
    setErrorMessage('');
    setRetryTarget(null);
    setBusyHabitId(habit.id);
    applyOptimisticEntry(habit, count);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        rollbackOptimisticEntry(habit, previousEntry);
        setRetryTarget({ habitId: habit.id, count });
        setErrorMessage('ログイン状態を確認できませんでした。再ログインしてください。');
        return;
      }

      const entryKey = {
        user_id: user.id,
        habit_id: habit.id,
        date_key: today,
      };
      const entryValues = {
        count,
        completed: count >= habit.goal_count,
      };
      const entryValuesWithoutCompleted = {
        count,
      };

      const result = await writeEntryWithCompat(
        {
          upsert: async (values) => {
            const { error } = await supabase
              .from('entries')
              .upsert({ ...entryKey, ...values }, { onConflict: 'user_id,habit_id,date_key' });
            return error;
          },
          update: async (values) => {
            const { data, error } = await supabase
              .from('entries')
              .update(values)
              .eq('user_id', entryKey.user_id)
              .eq('habit_id', entryKey.habit_id)
              .eq('date_key', entryKey.date_key)
              .select('habit_id');

            return { error, updated: (data ?? []).length > 0 };
          },
          insert: async (values) => {
            const { error } = await supabase.from('entries').insert({ ...entryKey, ...values });
            return error;
          },
        },
        entryValues,
        entryValuesWithoutCompleted,
      );

      if (!result.ok) {
        rollbackOptimisticEntry(habit, previousEntry);
        setRetryTarget({ habitId: habit.id, count });
        console.error('[today/updateEntry] failed to persist entry', {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
          stage: result.stage,
          usedLegacyPayload: result.usedLegacyPayload,
          entryKey,
          entryValues,
        });
        setErrorMessage('完了状態の更新に失敗しました。時間をおいて再度お試しください。');
        return;
      }
    } finally {
      setBusyHabitId(null);
    }
  };

  const bump = async (habit: Habit, delta: number) => {
    const current = entryMap.get(habit.id);
    await updateEntry(habit, nextCountFromBump(current, habit, delta), current);
  };

  const toggleDone = async (habit: Habit) => {
    const current = entryMap.get(habit.id);
    await updateEntry(habit, nextCountFromToggle(current, habit), current);
  };

  const retryUpdate = async () => {
    if (!retryTarget) return;
    const habit = habits.find((item) => item.id === retryTarget.habitId);
    if (!habit) {
      setRetryTarget(null);
      return;
    }
    const current = entryMap.get(habit.id);
    await updateEntry(habit, retryTarget.count, current);
  };

  const completedCount = dueHabits.filter((habit) => isEntryDone(entryMap.get(habit.id), habit)).length;

  const HabitRow = ({ habit }: { habit: Habit }) => {
    const entry = entryMap.get(habit.id);
    const count = entry?.count ?? 0;
    const done = isEntryDone(entry, habit);
    const progress = Math.min(1, count / habit.goal_count);
    const accentColor = habit.schedule?.accentColor ?? '#111111';

    return (
      <div className="border-b border-[#ebebeb] py-5 sm:py-6">
        <div className="flex items-start justify-between gap-3 sm:items-center sm:gap-4">
          <button className="tap-active text-left" onClick={() => void bump(habit, 1)} disabled={busyHabitId === habit.id}>
            <p className={`text-lg font-black leading-tight tracking-tight sm:text-xl ${done ? 'opacity-40 line-through' : ''}`}>{habit.name}</p>
            <p className="mt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#888] sm:tracking-[0.4em]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
              {habit.frequency === 'flexible' ? `Weekly Goal: ${count} / ${habit.goal_count}` : `${count} / ${habit.goal_count} completed`}
            </p>
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {habit.external_url && (
              <a href={habit.external_url} target="_blank" rel="noreferrer" className="text-[#888] tap-active">
                ↗
              </a>
            )}
            <button onClick={() => void toggleDone(habit)} disabled={busyHabitId === habit.id}>
              <ProgressRing progress={progress} done={done} accentColor={accentColor} />
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

      {errorMessage && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-bold text-[#a33]">{errorMessage}</p>
          {retryTarget && (
            <button
              type="button"
              onClick={() => void retryUpdate()}
              disabled={busyHabitId !== null}
              className="tap-active rounded-full border border-[#a33] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#a33] disabled:opacity-50"
            >
              再試行
            </button>
          )}
        </div>
      )}

      {dueHabits.length === 0 && <p className="py-16 text-center text-lg font-bold text-[#888] sm:py-24 sm:text-xl">Nothing Scheduled</p>}

      {routineHabits.length > 0 && (
        <section>
          <p className="micro-label">Routine</p>
          <div className="mt-2 sm:mt-3">{routineHabits.map((habit) => <HabitRow key={habit.id} habit={habit} />)}</div>
        </section>
      )}

      {oneOffHabits.length > 0 && (
        <section>
          <p className="micro-label">One-off Tasks</p>
          <div className="mt-2 sm:mt-3">{oneOffHabits.map((habit) => <HabitRow key={habit.id} habit={habit} />)}</div>
        </section>
      )}
    </div>
  );
}
