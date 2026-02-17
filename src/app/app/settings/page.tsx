'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PostgrestError } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/browser';
import { validateImportPayload } from '@/lib/settings/importValidation';
import { UserSettings } from '@/types/domain';

type SectionStatus = '未実行' | `成功${string}` | `失敗: ${string}`;

type ImportResult = {
  habits: SectionStatus;
  entries: SectionStatus;
  user_settings: SectionStatus;
};

const INITIAL_IMPORT_RESULT: ImportResult = {
  habits: '未実行',
  entries: '未実行',
  user_settings: '未実行',
};

function formatImportSummary(results: ImportResult): string {
  const hasFailure = Object.values(results).some((result) => result.startsWith('失敗'));
  return [
    hasFailure ? 'Import completed with errors' : 'Import completed',
    `habits: ${results.habits}`,
    `entries: ${results.entries}`,
    `user_settings: ${results.user_settings}`,
  ].join('\n');
}

function toSectionStatus(error: PostgrestError | null, successLabel: string): SectionStatus {
  if (error) {
    return `失敗: ${error.message}`;
  }
  return `成功 (${successLabel})`;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [payload, setPayload] = useState('');
  const [message, setMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [runMigrationAfterImport, setRunMigrationAfterImport] = useState(false);

  const validation = useMemo(() => validateImportPayload(payload), [payload]);
  const hasPayload = payload.trim().length > 0;

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
      supabase.from('user_settings').select('*').single(),
    ]);

    setPayload(JSON.stringify({ habits: h.data, entries: e.data, user_settings: s.data }, null, 2));
    setMessage('Export completed');
  };

  const executeImport = async (migration = false) => {
    if (!validation.ok || !validation.parsed) {
      setMessage(`Import failed: ${validation.errors.join(' / ')}`);
      setShowConfirm(false);
      return;
    }

    const { habits, entries, user_settings } = validation.parsed;
    const supabase = createClient();
    const results: ImportResult = { ...INITIAL_IMPORT_RESULT };

    const habitsResult = await supabase.from('habits').upsert(habits, { onConflict: 'id' });
    results.habits = toSectionStatus(habitsResult.error, `${habits.length}件`);

    const entriesResult = await supabase.from('entries').upsert(entries, { onConflict: 'user_id,habit_id,date_key' });
    results.entries = toSectionStatus(entriesResult.error, `${entries.length}件`);

    if (user_settings) {
      const userSettingsResult = await supabase.from('user_settings').upsert(user_settings, { onConflict: 'user_id' });
      results.user_settings = toSectionStatus(userSettingsResult.error, '1件');
    }

    if (migration && settings) {
      await supabase.from('user_settings').update({ migration_done: true }).eq('user_id', settings.user_id);
    }

    setMessage(formatImportSummary(results));

    await load();
    setShowConfirm(false);
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
        <button
          className="tap-active flex w-full items-center justify-between py-4 text-left text-[11px] font-bold uppercase tracking-[0.15em] sm:py-5 sm:text-sm sm:tracking-[0.2em]"
          onClick={() => {
            setRunMigrationAfterImport(false);
            setShowConfirm(true);
          }}
        >
          Import JSON <span>›</span>
        </button>
        {!settings.migration_done && (
          <button
            className="tap-active flex w-full items-center justify-between py-4 text-left text-[11px] font-bold uppercase tracking-[0.15em] sm:py-5 sm:text-sm sm:tracking-[0.2em]"
            onClick={() => {
              setRunMigrationAfterImport(true);
              setShowConfirm(true);
            }}
          >
            Legacy Import <span>›</span>
          </button>
        )}
      </section>

      <textarea className="min-h-64 w-full rounded-3xl border-0 bg-[#f5f5f7] p-4 text-sm sm:min-h-72 sm:p-5" value={payload} onChange={(e) => setPayload(e.target.value)} placeholder="JSON payload" />

      {hasPayload && (
        <section className="rounded-3xl border border-[#ebebeb] bg-white p-4 text-sm">
          <p className="font-bold">Dry Run</p>
          {validation.ok && validation.parsed ? (
            <ul className="mt-2 space-y-1 text-[#666]">
              <li>habits: {validation.parsed.habits.length} 件</li>
              <li>entries: {validation.parsed.entries.length} 件</li>
              <li>user_settings: {validation.parsed.user_settings ? 'あり' : 'なし'}</li>
            </ul>
          ) : (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-red-600">
              {validation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {showConfirm && (
        <section className="rounded-3xl border border-black bg-white p-4">
          <p className="text-sm font-bold">この内容でインポートしますか？</p>
          <p className="mt-2 text-xs text-[#666]">失敗した項目があっても、成功した項目は反映されます。</p>
          <div className="mt-4 flex gap-2">
            <button className="tap-active rounded-2xl bg-black px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white disabled:opacity-40" disabled={!validation.ok} onClick={() => void executeImport(runMigrationAfterImport)}>実行</button>
            <button className="tap-active rounded-2xl bg-[#f5f5f7] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em]" onClick={() => setShowConfirm(false)}>キャンセル</button>
          </div>
        </section>
      )}

      {message && <p className="whitespace-pre-line rounded-2xl bg-[#f5f5f7] px-4 py-3 text-sm font-bold text-[#666]">{message}</p>}

      <footer className="pt-6 text-center">
        <p className="micro-label">HabHub v0.1.0</p>
        <p className="mt-3 text-sm text-[#888]">"The Beauty of Subtraction"</p>
      </footer>
    </div>
  );
}
