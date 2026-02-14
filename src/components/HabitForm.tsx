'use client';

import { useState } from 'react';
import { Habit } from '@/types/domain';

type Props = {
  initial?: Partial<Habit>;
  onSubmit: (payload: Partial<Habit>) => Promise<void>;
};

export function HabitForm({ initial, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [frequency, setFrequency] = useState<Habit['frequency']>(initial?.frequency ?? 'daily');
  const [goal, setGoal] = useState(initial?.goal_count ?? 1);
  const [weekDays, setWeekDays] = useState((initial?.schedule?.weekDays ?? []).join(','));
  const [monthDays, setMonthDays] = useState((initial?.schedule?.monthDays ?? []).join(','));
  const [targetIntervalCount, setTargetIntervalCount] = useState(initial?.schedule?.targetIntervalCount ?? 1);
  const [interval, setInterval] = useState<'week' | 'month'>(initial?.schedule?.interval ?? 'week');
  const [targetDate, setTargetDate] = useState(initial?.schedule?.targetDate ?? '');
  const [externalUrl, setExternalUrl] = useState(initial?.external_url ?? '');
  const [archived, setArchived] = useState(initial?.archived ?? false);

  return (
    <form className="space-y-3" onSubmit={async (e) => {
      e.preventDefault();
      await onSubmit({
        ...initial,
        name,
        frequency,
        goal_count: goal,
        schedule: {
          weekDays: weekDays ? weekDays.split(',').map((n) => Number(n.trim())) : undefined,
          monthDays: monthDays ? monthDays.split(',').map((n) => Number(n.trim())) : undefined,
          targetIntervalCount,
          interval,
          targetDate: targetDate || undefined
        },
        external_url: externalUrl || null,
        archived
      });
    }}>
      <input className="w-full" placeholder="Habit name" value={name} onChange={(e) => setName(e.target.value)} required />
      <select value={frequency} onChange={(e) => setFrequency(e.target.value as Habit['frequency'])}>
        <option value="daily">Daily</option>
        <option value="weekly_specific">Weekly specific</option>
        <option value="monthly_specific">Monthly specific</option>
        <option value="flexible">Flexible (週N/月N)</option>
        <option value="once">Once</option>
      </select>
      <input type="number" min={1} value={goal} onChange={(e) => setGoal(Number(e.target.value))} />
      {frequency === 'weekly_specific' && <input placeholder="weekDays: 0,1..6" value={weekDays} onChange={(e) => setWeekDays(e.target.value)} />}
      {frequency === 'monthly_specific' && <input placeholder="monthDays: 1..31,32(月末)" value={monthDays} onChange={(e) => setMonthDays(e.target.value)} />}
      {frequency === 'flexible' && <div className="flex gap-2"><select value={interval} onChange={(e) => setInterval(e.target.value as 'week' | 'month')}><option value="week">week</option><option value="month">month</option></select><input type="number" min={1} value={targetIntervalCount} onChange={(e) => setTargetIntervalCount(Number(e.target.value))} /></div>}
      {frequency === 'once' && <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />}
      <input className="w-full" placeholder="External URL" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} />
      <label className="flex gap-2 items-center"><input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />Archived</label>
      <button type="submit">Save</button>
    </form>
  );
}
