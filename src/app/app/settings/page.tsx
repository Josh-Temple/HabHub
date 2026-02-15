'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { Entry, Habit, UserSettings } from '@/types/domain';

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [payload, setPayload] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    const { data } = await createClient().from('user_settings').select('*').single();
    setSettings(data as UserSettings);
  };

  useEffect(() => {
    void load();
  }, []);

  const onExport = async () => {
    const supabase = createClient();
    const [h, e, s] = await Promise.all([
      supabase.from('habits').select('*'),
      supabase.from('entries').select('*'),
      supabase.from('user_settings').select('*').single()
    ]);
    setPayload(JSON.stringify({ habits: h.data, entries: e.data, user_settings: s.data }, null, 2));
  };

  const onImport = async (migration = false) => {
    try {
      const data = JSON.parse(payload) as { habits?: Habit[]; entries?: Entry[]; user_settings?: Partial<UserSettings> };
      if (!Array.isArray(data.habits) || !Array.isArray(data.entries)) throw new Error('invalid JSON shape');
      const supabase = createClient();
      await supabase.from('habits').upsert(data.habits, { onConflict: 'id' });
      await supabase.from('entries').upsert(data.entries, { onConflict: 'user_id,habit_id,date_key' });
      if (data.user_settings) await supabase.from('user_settings').upsert(data.user_settings, { onConflict: 'user_id' });
      if (migration && settings) await supabase.from('user_settings').update({ migration_done: true }).eq('user_id', settings.user_id);
      setMessage('Import completed');
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    }
  };

  if (!settings) return <p>Loading...</p>;

  return (
    <div className="space-y-7 sm:space-y-8">
      <section>
        <p className="micro-label">Configuration</p>
        <h1 className="mt-3 text-4xl font-black leading-[0.95] tracking-tighter sm:text-6xl">Settings</h1>
      </section>

      <section className="divide-y divide-[#ebebeb] rounded-3xl border border-[#ebebeb] bg-white px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 py-4 text-[11px] font-bold uppercase tracking-[0.15em] sm:py-5 sm:text-sm sm:tracking-[0.2em]">
          Week Start
          <select
            value={settings.week_start}
            onChange={async (e) => {
              const week_start = Number(e.target.value);
              await createClient().from('user_settings').update({ week_start }).eq('user_id', settings.user_id);
              setSettings({ ...settings, week_start });
            }}
            className="rounded-xl border-0 bg-[#f5f5f7] px-3 py-2 text-[11px] sm:text-xs"
          >
            <option value={0}>Sun</option>
            <option value={1}>Mon</option>
          </select>
        </div>
        <button className="tap-active flex w-full items-center justify-between py-4 text-left text-[11px] font-bold uppercase tracking-[0.15em] sm:py-5 sm:text-sm sm:tracking-[0.2em]" onClick={onExport}>Export JSON <span>›</span></button>
        <button className="tap-active flex w-full items-center justify-between py-4 text-left text-[11px] font-bold uppercase tracking-[0.15em] sm:py-5 sm:text-sm sm:tracking-[0.2em]" onClick={() => onImport(false)}>Import JSON <span>›</span></button>
        {!settings.migration_done && <button className="tap-active flex w-full items-center justify-between py-4 text-left text-[11px] font-bold uppercase tracking-[0.15em] sm:py-5 sm:text-sm sm:tracking-[0.2em]" onClick={() => onImport(true)}>Legacy Import <span>›</span></button>}
      </section>

      <textarea className="min-h-64 w-full rounded-3xl border-0 bg-[#f5f5f7] p-4 text-sm sm:min-h-72 sm:p-5" value={payload} onChange={(e) => setPayload(e.target.value)} placeholder="JSON payload" />
      {message && <p className="text-sm font-bold text-[#888]">{message}</p>}

      <footer className="pt-6 text-center">
        <p className="micro-label">HabHub v0.1.0</p>
        <p className="mt-3 text-sm text-[#888]">"The Beauty of Subtraction"</p>
      </footer>
    </div>
  );
}
