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
      {done && (
        <text x="20" y="24" textAnchor="middle" className="text-[12px]" fill={accentColor}>
          ✓
        </text>
      )}
    </svg>
  );
}

function habitPriority(habit: Habit): number {
  if (habit.frequency === 'once') return 0;
  if (habit.frequency === 'flexible') return 1;
  return 2;
}

export default function TodayPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [settings, setSettings] = useState<UserSettings>({ user_id: '', week_start: 1, language: 'en', migration_done: false });
  const [busyHabitId, setBusyHabitId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [retryTarget, setRetryTarget] = useState<{ habitId: string; count: number } | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const today = toDateKey(new Date());

  const entryMap = useMemo(() => new Map(entries.filter((entry) => entry.date_key === today).map((entry) => [entry.habit_id, entry])), [entries, today]);

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
      setSettings({ language: 'en', ...(s as UserSettings) });
      return;
    }

    if (u.user) {
      const { data } = await supabase.from('user_settings').upsert({ user_id: u.user.id, week_start: 1, language: 'en' }, { onConflict: 'user_id' }).select('*').single();
      setSettings(data as UserSettings);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const dueHabits = useMemo(() => habits.filter((habit) => isHabitDue(habit, today, entries, settings)), [habits, entries, settings, today]);
  const activeDueHabits = useMemo(() => dueHabits.filter((habit) => !isEntryDone(entryMap.get(habit.id), habit)).sort((a, b) => habitPriority(a) - habitPriority(b)), [dueHabits, entryMap]);
  const completedDueHabits = useMemo(() => dueHabits.filter((habit) => isEntryDone(entryMap.get(habit.id), habit)), [dueHabits, entryMap]);

  const routineHabits = activeDueHabits.filter((habit) => habit.frequency !== 'once');
  const oneOffHabits = activeDueHabits.filter((habit) => habit.frequency === 'once');
  const completedRoutineHabits = completedDueHabits.filter((habit) => habit.frequency !== 'once');
  const completedOneOffHabits = completedDueHabits.filter((habit) => habit.frequency === 'once');

  const applyOptimisticEntry = (habit: Habit, count: number) => {
    setEntries((previousEntries) => {
      let found = false;
      const nextEntries = previousEntries.map((entry) => {
        if (entry.habit_id !== habit.id || entry.date_key !== today) return entry;
        found = true;
        return { ...entry, count, completed: count >= habit.goal_count };
      });
      if (found) return nextEntries;
      return [...nextEntries, { user_id: settings.user_id, habit_id: habit.id, date_key: today, count, completed: count >= habit.goal_count }];
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        rollbackOptimisticEntry(habit, previousEntry);
        setRetryTarget({ habitId: habit.id, count });
        setErrorMessage('ログイン状態を確認できませんでした。再ログインしてください。');
        return;
      }

      const entryKey = { user_id: user.id, habit_id: habit.id, date_key: today };
      const entryValues = { count, completed: count >= habit.goal_count };
      const entryValuesWithoutCompleted = { count };

      const result = await writeEntryWithCompat(
        {
          upsert: async (values) => {
            const { error } = await supabase.from('entries').upsert({ ...entryKey, ...values }, { onConflict: 'user_id,habit_id,date_key' });
            return error;
          },
          update: async (values) => {
            const { data, error } = await supabase.from('entries').update(values).eq('user_id', entryKey.user_id).eq('habit_id', entryKey.habit_id).eq('date_key', entryKey.date_key).select('habit_id');
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
        setErrorMessage('完了状態の更新に失敗しました。時間をおいて再度お試しください。');
      }
    } finally {
      setBusyHabitId(null);
    }
  };

  const bump = async (habit: Habit) => {
    const current = entryMap.get(habit.id);
    await updateEntry(habit, nextCountFromBump(current, habit, 1), current);
  };

  const toggleDone = async (habit: Habit) => {
    const current = entryMap.get(habit.id);
    await updateEntry(habit, nextCountFromToggle(current, habit), current);
  };

  const retryUpdate = async () => {
    if (!retryTarget) return;
    const habit = habits.find((item) => item.id === retryTarget.habitId);
    if (!habit) return;
    const current = entryMap.get(habit.id);
    await updateEntry(habit, retryTarget.count, current);
  };

  const completedCount = completedDueHabits.length;
  const remainingCount = dueHabits.length - completedCount;

  const HabitRow = ({ habit }: { habit: Habit }) => {
    const entry = entryMap.get(habit.id);
    const count = entry?.count ?? 0;
    const done = isEntryDone(entry, habit);
    const progress = Math.min(1, count / habit.goal_count);
    const accentColor = habit.schedule?.accentColor ?? '#111111';

    return (
      <div className="border-b border-[#ebebeb] py-5 sm:py-6">
        <div className="flex items-start justify-between gap-3 sm:items-center sm:gap-4">
          <button className="tap-active text-left" onClick={() => void bump(habit)} disabled={busyHabitId === habit.id}>
            <p className={`text-lg font-black leading-tight tracking-tight sm:text-xl ${done ? 'opacity-50 line-through' : ''}`}>{habit.name}</p>
            <p className="mt-2 flex items-center gap-2 text-[11px] font-bold text-[#666]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
              {habit.frequency === 'flexible' ? `週間目標: ${count} / ${habit.goal_count}` : `${count} / ${habit.goal_count} 完了`}
            </p>
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {habit.external_url && (
              <a href={habit.external_url} target="_blank" rel="noreferrer" className="text-[#666] tap-active" aria-label="外部リンクを開く">
                ↗
              </a>
            )}
            <button onClick={() => void toggleDone(habit)} disabled={busyHabitId === habit.id} aria-label={`${habit.name} の完了を切り替える`}>
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
        <p className="micro-label">今日のダッシュボード</p>
        <h1 className="mt-3 text-4xl font-black leading-[0.95] tracking-tighter sm:text-6xl">今日のフォーカス</h1>
      </section>

      <section className="space-y-4 rounded-3xl border border-[#ebebeb] p-5 sm:p-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <p className="text-5xl font-black leading-none tracking-tighter sm:text-6xl">
            {String(completedCount).padStart(2, '0')}
            <span className="ml-1 text-3xl text-[#9f9fa8] sm:ml-2 sm:text-4xl">/{String(dueHabits.length).padStart(2, '0')}</span>
          </p>
          <p className="text-xs font-bold text-[#666]">今日の進捗</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#f5f5f7] px-3 py-2 text-xs font-bold text-[#555]">未完了: {remainingCount}</div>
          <div className="rounded-2xl bg-[#f5f5f7] px-3 py-2 text-xs font-bold text-[#555]">完了済み: {completedCount}</div>
          <div className="rounded-2xl bg-[#f5f5f7] px-3 py-2 text-xs font-bold text-[#555] sm:block hidden">対象習慣: {dueHabits.length}</div>
        </div>
      </section>

      {errorMessage && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-bold text-[#a33]">{errorMessage}</p>
          {retryTarget && (
            <button type="button" onClick={() => void retryUpdate()} disabled={busyHabitId !== null} className="tap-active rounded-full border border-[#a33] px-3 py-1 text-xs font-black tracking-[0.1em] text-[#a33] disabled:opacity-50">
              再試行
            </button>
          )}
        </div>
      )}

      <section>
        <p className="micro-label">今やるタスク</p>
        {dueHabits.length === 0 && <p className="py-16 text-center text-lg font-bold text-[#666] sm:py-24 sm:text-xl">今日の予定はありません</p>}

        {routineHabits.length > 0 && <div className="mt-2 sm:mt-3">{routineHabits.map((habit) => <HabitRow key={habit.id} habit={habit} />)}</div>}
        {oneOffHabits.length > 0 && <div className="mt-2 sm:mt-3">{oneOffHabits.map((habit) => <HabitRow key={habit.id} habit={habit} />)}</div>}
      </section>

      {completedDueHabits.length > 0 && (
        <section>
          <button type="button" onClick={() => setShowCompleted((prev) => !prev)} className="tap-active micro-label flex items-center gap-2 text-left">
            <span>完了済み ({String(completedDueHabits.length).padStart(2, '0')})</span>
            <span className="text-xs text-[#666]">{showCompleted ? '閉じる' : '表示'}</span>
          </button>

          {showCompleted && (
            <div className="mt-2 space-y-6 sm:mt-3">
              {completedRoutineHabits.length > 0 && <div>{completedRoutineHabits.map((habit) => <HabitRow key={habit.id} habit={habit} />)}</div>}
              {completedOneOffHabits.length > 0 && <div>{completedOneOffHabits.map((habit) => <HabitRow key={habit.id} habit={habit} />)}</div>}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
