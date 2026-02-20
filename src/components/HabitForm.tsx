'use client';

import { useMemo, useState } from 'react';
import { Habit } from '@/types/domain';

const ACCENT_COLORS = ['#111111', '#8E8E93', '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#AF52DE'];
const STEPS = ['Basics', 'Frequency', 'Goal', 'Details'] as const;

type Props = {
  initial?: Partial<Habit>;
  onSubmit: (payload: Partial<Habit>) => Promise<void>;
};

export function HabitForm({ initial, onSubmit }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial?.name ?? '');
  const [frequency, setFrequency] = useState<Habit['frequency']>(initial?.frequency ?? 'daily');
  const [goal, setGoal] = useState(initial?.goal_count ?? 1);
  const [weekDays, setWeekDays] = useState<number[]>(initial?.schedule?.weekDays ?? []);
  const [monthDays, setMonthDays] = useState<number[]>(initial?.schedule?.monthDays ?? []);
  const [targetIntervalCount, setTargetIntervalCount] = useState(initial?.schedule?.targetIntervalCount ?? 1);
  const [interval, setInterval] = useState<'week' | 'month'>(initial?.schedule?.interval ?? 'week');
  const [targetDate, setTargetDate] = useState(initial?.schedule?.targetDate ?? '');
  const [externalUrl, setExternalUrl] = useState(initial?.external_url ?? '');
  const [accentColor, setAccentColor] = useState(initial?.schedule?.accentColor ?? '#111111');
  const [archived, setArchived] = useState(initial?.archived ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const specificMode = frequency === 'weekly_specific' || frequency === 'monthly_specific';
  const canGoNext = step !== 0 || name.trim().length > 0;

  const frequencyLabel = useMemo(() => {
    if (frequency === 'daily') return 'times / day';
    if (frequency === 'weekly_specific') return 'times / week';
    if (frequency === 'monthly_specific') return 'times / month';
    if (frequency === 'flexible') return interval === 'week' ? 'times / week' : 'times / month';
    return 'times';
  }, [frequency, interval]);

  const toggleWeekDay = (day: number) => {
    setWeekDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const toggleMonthDay = (day: number) => {
    setMonthDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const submit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
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
          targetDate: targetDate || undefined,
          accentColor,
        },
        external_url: externalUrl || null,
        archived,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save. Please try again later.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="space-y-7 sm:space-y-8"
      onSubmit={async (e) => {
        e.preventDefault();
        if (step < STEPS.length - 1) {
          setStep((prev) => prev + 1);
          return;
        }
        await submit();
      }}
    >
      <section className="space-y-3">
        <p className="micro-label">Habit creation flow</p>
        <div className="grid grid-cols-4 gap-2 rounded-3xl bg-[#f5f5f7] p-2">
          {STEPS.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className={`rounded-2xl px-2 py-2 text-[11px] font-bold ${step === index ? 'bg-white text-black' : 'text-[#777]'}`}
            >
              {index + 1}. {label}
            </button>
          ))}
        </div>
      </section>

      {step === 0 && (
        <section>
          <p className="micro-label">Habit name</p>
          <input
            className="mt-3 w-full rounded-3xl border-0 bg-[#f5f5f7] px-5 py-4 text-xl font-bold tracking-tight outline-none sm:px-6 sm:py-5 sm:text-2xl"
            placeholder="What habit do you want to keep?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </section>
      )}

      {step === 1 && (
        <section className="space-y-3">
          <p className="micro-label">Frequency</p>
          <div className="grid grid-cols-2 gap-2 rounded-3xl bg-[#f5f5f7] p-2 sm:grid-cols-3">
            {(['daily', 'weekly_specific', 'monthly_specific'] as Habit['frequency'][]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFrequency(option)}
                className={`tap-active rounded-2xl px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] sm:text-xs sm:tracking-[0.22em] ${frequency === option ? 'bg-white text-black shadow-sm' : 'text-[#666]'}`}
              >
                {option === 'daily' ? 'Daily' : option === 'weekly_specific' ? 'Specific weekdays' : 'Specific month dates'}
              </button>
            ))}
            <button type="button" onClick={() => setFrequency('flexible')} className={`tap-active col-span-2 rounded-2xl px-3 py-2.5 text-[11px] font-bold ${frequency === 'flexible' ? 'bg-white text-black shadow-sm' : 'text-[#666]'}`}>Count only (flexible)</button>
            <button type="button" onClick={() => setFrequency('once')} className={`tap-active rounded-2xl px-3 py-2.5 text-[11px] font-bold ${frequency === 'once' ? 'bg-white text-black shadow-sm' : 'text-[#666]'}`}>One-time</button>
          </div>

          {specificMode && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#666]">Select days</p>
              {frequency === 'weekly_specific' ? (
                <div className="grid grid-cols-7 gap-2">
                  {'SMTWTFS'.split('').map((d, i) => (
                    <button key={`${d}-${i}`} type="button" onClick={() => toggleWeekDay(i)} className={`tap-active rounded-2xl py-3 text-sm font-bold ${weekDays.includes(i) ? 'bg-black text-white' : 'bg-[#f5f5f7] text-[#666]'}`}>{d}</button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <button key={d} type="button" onClick={() => toggleMonthDay(d)} className={`tap-active rounded-xl py-2 text-xs font-bold ${monthDays.includes(d) ? 'bg-black text-white' : 'bg-[#f5f5f7] text-[#666]'}`}>{d}</button>
                  ))}
                </div>
              )}
            </div>
          )}

          {frequency === 'flexible' && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#666]">Interval and target count</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                <button type="button" className={`tap-active rounded-2xl px-4 py-3 text-sm font-bold ${interval === 'week' ? 'bg-black text-white' : 'bg-[#f5f5f7] text-[#666]'}`} onClick={() => setInterval('week')}>Week</button>
                <button type="button" className={`tap-active rounded-2xl px-4 py-3 text-sm font-bold ${interval === 'month' ? 'bg-black text-white' : 'bg-[#f5f5f7] text-[#666]'}`} onClick={() => setInterval('month')}>Month</button>
                <input type="number" min={1} value={targetIntervalCount} onChange={(e) => setTargetIntervalCount(Number(e.target.value))} className="w-full rounded-2xl border-0 bg-[#f5f5f7] px-4 py-3 text-lg font-bold sm:text-xl" />
              </div>
            </div>
          )}

          {frequency === 'once' && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#666]">Planned date</p>
              <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="w-full rounded-2xl border-0 bg-[#f5f5f7] px-5 py-4 text-lg font-bold" />
            </div>
          )}
        </section>
      )}

      {step === 2 && (
        <section>
          <p className="micro-label">Goal count</p>
          <div className="mt-3 rounded-3xl bg-[#f5f5f7] px-5 py-5 text-3xl font-black sm:px-6 sm:py-6 sm:text-4xl">
            {goal}
            <span className="ml-3 text-lg text-[#73737c]">{frequencyLabel}</span>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[1, 3, 5, 10].map((preset) => (
              <button key={preset} type="button" className="tap-active rounded-xl bg-[#f5f5f7] py-2 text-sm font-bold" onClick={() => setGoal(preset)}>{preset}</button>
            ))}
          </div>
          <input type="range" min={1} max={10} value={goal} onChange={(e) => setGoal(Number(e.target.value))} className="mt-4 w-full" />
        </section>
      )}

      {step === 3 && (
        <section className="space-y-5">
          <div>
            <p className="micro-label">Theme color</p>
            <div className="mt-3 grid grid-cols-4 gap-3 rounded-3xl bg-[#f5f5f7] p-4">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAccentColor(color)}
                  className={`tap-active h-7 w-7 rounded-full ring-offset-2 transition-all ${accentColor === color ? 'scale-110 ring-2 ring-black' : 'opacity-60 hover:opacity-100'}`}
                  style={{ backgroundColor: color }}
                  aria-label={`Choose accent ${color}`}
                >
                  {accentColor === color && <span className="block h-2 w-2 rounded-full bg-white/90 shadow-sm" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="micro-label">Advanced settings</p>
            <input className="mt-3 w-full rounded-3xl border-0 bg-[#f5f5f7] px-5 py-4 text-base tracking-tight" placeholder="https://... or anki://..." value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} />
            <label className="mt-3 flex items-center gap-3 text-sm font-bold text-[#666]">
              <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} className="h-5 w-5" />
              Archive this habit
            </label>
          </div>
        </section>
      )}

      {submitError && <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{submitError}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={() => setStep((prev) => Math.max(0, prev - 1))} disabled={step === 0} className="tap-active w-1/3 rounded-full border border-[#ddd] py-3 text-xs font-black disabled:opacity-40">Back</button>
        <button type="submit" disabled={!canGoNext || isSubmitting} className="tap-active w-2/3 rounded-full bg-black py-3 text-[12px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-40">
          {step === STEPS.length - 1 ? (isSubmitting ? 'Saving…' : 'Save') : 'Next'}
        </button>
      </div>
    </form>
  );
}
