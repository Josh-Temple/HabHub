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

  useEffect(() => { void load(); }, []);

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
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Settings</h1>
      <label className="block">Week Start
        <select value={settings.week_start} onChange={async (e) => {
          const week_start = Number(e.target.value);
          await createClient().from('user_settings').update({ week_start }).eq('user_id', settings.user_id);
          setSettings({ ...settings, week_start });
        }}>
          <option value={0}>Sun</option>
          <option value={1}>Mon</option>
        </select>
      </label>
      <div className="space-x-2">
        <button onClick={onExport}>Export JSON</button>
        <button onClick={() => onImport(false)}>Import JSON</button>
        {!settings.migration_done && <button onClick={() => onImport(true)}>初回インポート(旧localStorage JSON)</button>}
      </div>
      <textarea className="w-full min-h-80" value={payload} onChange={(e) => setPayload(e.target.value)} placeholder="JSON paste area" />
      <p>{message}</p>
    </div>
  );
}
