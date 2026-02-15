'use client';

import { useMemo, useState } from 'react';
import { Habit } from '@/types/domain';

type Props = {
  initial?: Partial<Habit>;
  onSubmit: (payload: Partial<Habit>) => Promise<void>;
};

const icons = ['☯', '⚡', '🧠', '✍', '🎵', '🏠', '🛒', '🧹', '🐾', '🚗', '🎮', '🏆'];
const colors = ['#000000', '#d9d9de', '#f0c9c9', '#efd9b6', '#ece0b6', '#bde0c4', '#b8d2ef', '#dac8eb'];

export function HabitForm({ initial, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [frequency, setFrequency] = useState<Habit['frequency']>(initial?.frequency ?? 'daily');
  const [goal, setGoal] = useState(initial?.goal_count ?? 1);
  const [weekDays, setWeekDays] = useState<number[]>(initial?.schedule?.weekDays ?? []);
  const [monthDays, setMonthDays] = useState<number[]>(initial?.schedule?.monthDays ?? []);
  const [targetIntervalCount, setTargetIntervalCount] = useState(initial?.schedule?.targetIntervalCount ?? 1);
  const [interval, setInterval] = useState<'week' | 'month'>(initial?.schedule?.interval ?? 'week');
  const [targetDate, setTargetDate] = useState(initial?.schedule?.targetDate ?? '');
  const [externalUrl, setExternalUrl] = useState(initial?.external_url ?? '');
  const [archived, setArchived] = useState(initial?.archived ?? false);
  const [icon, setIcon] = useState('☯');
  const [customIcon, setCustomIcon] = useState('');
  const [colorAccent, setColorAccent] = useState('#000000');

  const specificMode = frequency === 'weekly_specific' || frequency === 'monthly_specific';
  const frequencyLabel = useMemo(() => {
    if (frequency === 'daily') return 'TIMES/DAY';
    if (frequency === 'weekly_specific') return 'TIMES/WEEK';
    if (frequency === 'monthly_specific') return 'TIMES/MONTH';
    if (frequency === 'flexible') return interval === 'week' ? 'TIMES/WEEK' : 'TIMES/MONTH';
    return 'TIMES';
  }, [frequency, interval]);

  const toggleWeekDay = (day: number) => {
    setWeekDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const toggleMonthDay = (day: number) => {
    setMonthDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  return (
    <form
      className="space-y-7 sm:space-y-8"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit({
          ...initial,
          name,
          frequency,
          goal_count: goal,
          schedule: {
            weekDays: weekDays.length ? weekDays : undefined,
            monthDays: monthDays.length ? monthDays : undefined,
            targetIntervalCount,
            interval,
            targetDate: targetDate || undefined
          },
          external_url: externalUrl || null,
          archived
        });
      }}
    >
      <section>
        <p className="micro-label">New Item</p>
        <input
          className="mt-3 w-full rounded-3xl border-0 bg-[#f5f5f7] px-5 py-4 text-xl font-bold tracking-tight outline-none sm:px-6 sm:py-5 sm:text-2xl"
          placeholder="What are you building?"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </section>

      <section className="grid grid-cols-2 gap-2 rounded-3xl bg-[#f5f5f7] p-2 sm:grid-cols-3">
        {(['daily', 'weekly_specific', 'monthly_specific'] as Habit['frequency'][]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFrequency(option)}
            className={`tap-active rounded-2xl px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] sm:text-xs sm:tracking-[0.22em] ${frequency === option ? 'bg-white text-black shadow-sm' : 'text-[#888]'}`}
          >
            {option === 'daily' ? 'Daily' : option === 'weekly_specific' ? 'Weekly' : 'Monthly'}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFrequency('flexible')}
          className={`tap-active col-span-2 rounded-2xl px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] sm:text-xs sm:tracking-[0.22em] ${frequency === 'flexible' ? 'bg-white text-black shadow-sm' : 'text-[#888]'}`}
        >
          Flexible Count
        </button>
        <button
          type="button"
          onClick={() => setFrequency('once')}
          className={`tap-active rounded-2xl px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] sm:text-xs sm:tracking-[0.22em] ${frequency === 'once' ? 'bg-white text-black shadow-sm' : 'text-[#888]'}`}
        >
          One-off
        </button>
      </section>

      {specificMode && (
        <section className="space-y-3">
          <p className="micro-label">Specific Days</p>
          {frequency === 'weekly_specific' ? (
            <div className="grid grid-cols-7 gap-2">
              {'SMTWTFS'.split('').map((d, i) => (
                <button key={`${d}-${i}`} type="button" onClick={() => toggleWeekDay(i)} className={`tap-active rounded-2xl py-3 text-sm font-bold ${weekDays.includes(i) ? 'bg-black text-white' : 'bg-[#f5f5f7] text-[#888]'}`}>
                  {d}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <button key={d} type="button" onClick={() => toggleMonthDay(d)} className={`tap-active rounded-xl py-2 text-xs font-bold ${monthDays.includes(d) ? 'bg-black text-white' : 'bg-[#f5f5f7] text-[#888]'}`}>
                  {d}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {frequency === 'flexible' && (
        <section className="space-y-3">
          <p className="micro-label">Flexible Count</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <button type="button" className={`tap-active rounded-2xl px-4 py-3 text-sm font-bold ${interval === 'week' ? 'bg-black text-white' : 'bg-[#f5f5f7] text-[#888]'}`} onClick={() => setInterval('week')}>Week</button>
            <button type="button" className={`tap-active rounded-2xl px-4 py-3 text-sm font-bold ${interval === 'month' ? 'bg-black text-white' : 'bg-[#f5f5f7] text-[#888]'}`} onClick={() => setInterval('month')}>Month</button>
            <input type="number" min={1} value={targetIntervalCount} onChange={(e) => setTargetIntervalCount(Number(e.target.value))} className="w-full rounded-2xl border-0 bg-[#f5f5f7] px-4 py-3 text-lg font-bold sm:text-xl" />
          </div>
        </section>
      )}

      {frequency === 'once' && (
        <section className="space-y-3">
          <p className="micro-label">Target Date</p>
          <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="w-full rounded-2xl border-0 bg-[#f5f5f7] px-5 py-4 text-lg font-bold" />
        </section>
      )}

      <section className="rounded-3xl bg-[#f7f7f8] p-4">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 sm:gap-3">
          {icons.map((item) => (
            <button key={item} type="button" className={`tap-active rounded-2xl bg-white/70 py-2.5 text-xl sm:py-3 sm:text-2xl ${icon === item && !customIcon ? 'ring-2 ring-black' : ''}`} onClick={() => { setIcon(item); setCustomIcon(''); }}>
              {item}
            </button>
          ))}
        </div>
        <input className="mt-3 w-full rounded-2xl border-0 bg-white/80 px-5 py-3 text-center text-2xl sm:py-4 sm:text-3xl" placeholder="Or type an Emoji..." value={customIcon} onChange={(e) => setCustomIcon(e.target.value.slice(0, 2))} />
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <p className="micro-label">Daily Goal</p>
          <div className="mt-3 rounded-3xl bg-[#f5f5f7] px-5 py-5 text-3xl font-black sm:px-6 sm:py-6 sm:text-4xl">{goal}<span className="ml-3 text-lg text-[#c3c3c7]">{frequencyLabel}</span></div>
          <input type="range" min={1} max={10} value={goal} onChange={(e) => setGoal(Number(e.target.value))} className="mt-4 w-full" />
        </div>
        <div>
          <p className="micro-label">Color Accent</p>
          <div className="mt-4 grid grid-cols-4 gap-2 sm:mt-5 sm:gap-3">
            {colors.map((color) => (
              <button key={color} type="button" onClick={() => setColorAccent(color)} className={`tap-active h-10 w-10 rounded-full ${colorAccent === color ? 'ring-2 ring-black ring-offset-2 ring-offset-white' : ''}`} style={{ backgroundColor: color }}>
                <span className="sr-only">pick {color}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <p className="micro-label">External Integration</p>
        <input className="mt-3 w-full rounded-3xl border-0 bg-[#f5f5f7] px-5 py-4 text-base tracking-tight sm:px-6 sm:py-5 sm:text-lg" placeholder="https://... or anki://..." value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} />
      </section>

      <label className="flex items-center gap-3 text-sm font-bold text-[#888]">
        <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} className="h-5 w-5" />
        Archive this habit
      </label>

      <button type="submit" className="tap-active w-full rounded-full bg-black py-4 text-[12px] font-black uppercase tracking-[0.35em] text-white sm:py-5 sm:text-[13px] sm:tracking-[0.6em]">
        Confirm
      </button>
    </form>
  );
}
