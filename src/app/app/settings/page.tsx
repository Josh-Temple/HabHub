'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PostgrestError } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/browser';
import { validateImportPayload } from '@/lib/settings/importValidation';
import { UserSettings } from '@/types/domain';

type SectionStatus = 'Not run' | `Success${string}` | `Failed: ${string}`;

type ImportResult = {
  habits: SectionStatus;
  entries: SectionStatus;
  user_settings: SectionStatus;
};

const INITIAL_IMPORT_RESULT: ImportResult = {
  habits: 'Not run',
  entries: 'Not run',
  user_settings: 'Not run',
};

function formatImportSummary(results: ImportResult): string {
  const hasFailure = Object.values(results).some((result) => result.startsWith('Failed'));
  return [
    hasFailure ? 'Import completed (with errors)' : 'Import completed',
    `habits: ${results.habits}`,
    `entries: ${results.entries}`,
    `user_settings: ${results.user_settings}`,
  ].join('\n');
}

function toSectionStatus(error: PostgrestError | null, successLabel: string): SectionStatus {
  if (error) {
    return `Failed: ${error.message}`;
  }
  return `Success (${successLabel})`;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [payload, setPayload] = useState('');
  const [message, setMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [runMigrationAfterImport, setRunMigrationAfterImport] = useState(false);

  const validation = useMemo(() => validateImportPayload(payload), [payload]);
  const hasPayload = payload.trim().length > 0;
  const lang = settings?.language ?? 'en';
  const isJa = lang === 'ja';

  const ui = {
    loading: isJa ? '読み込み中...' : 'Loading...',
    settings: isJa ? '設定' : 'Settings',
    language: isJa ? '言語' : 'Language',
    weekStart: isJa ? '週の開始日' : 'Week start',
    exportJson: isJa ? 'JSONをエクスポート' : 'Export JSON',
    importJson: isJa ? 'JSONをインポート' : 'Import JSON',
    importLegacy: isJa ? '旧データをインポート' : 'Import legacy data',
    jsonData: isJa ? 'JSONデータ' : 'JSON data',
    preflight: isJa ? '事前確認' : 'Preflight check',
    yes: isJa ? 'あり' : 'yes',
    no: isJa ? 'なし' : 'no',
    confirm: isJa ? 'この内容でインポートしますか？' : 'Import this payload?',
    note: isJa ? '失敗した項目があっても、成功した項目は反映されます。' : 'Successful sections are applied even if some sections fail.',
    run: isJa ? '実行' : 'Run',
    cancel: isJa ? 'キャンセル' : 'Cancel',
  };

  const load = async () => {
    const { data } = await createClient().from('user_settings').select('*').single();
    const userSettings = data as UserSettings;
    setSettings({ ...userSettings, language: userSettings.language ?? 'en' });
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
    setMessage(isJa ? 'エクスポート完了' : 'Export completed');
  };

  const executeImport = async (migration = false) => {
    if (!validation.ok || !validation.parsed) {
      setMessage(isJa ? `インポート失敗: ${validation.errors.join(' / ')}` : `Import failed: ${validation.errors.join(' / ')}`);
      setShowConfirm(false);
      return;
    }

    const { habits, entries, user_settings } = validation.parsed;
    const supabase = createClient();
    const results: ImportResult = { ...INITIAL_IMPORT_RESULT };

    const habitsResult = await supabase.from('habits').upsert(habits, { onConflict: 'id' });
    results.habits = toSectionStatus(habitsResult.error, `${habits.length} items`);

    const entriesResult = await supabase.from('entries').upsert(entries, { onConflict: 'user_id,habit_id,date_key' });
    results.entries = toSectionStatus(entriesResult.error, `${entries.length} items`);

    if (user_settings) {
      const userSettingsResult = await supabase.from('user_settings').upsert(user_settings, { onConflict: 'user_id' });
      results.user_settings = toSectionStatus(userSettingsResult.error, '1 item');
    }

    if (migration && settings) {
      await supabase.from('user_settings').update({ migration_done: true }).eq('user_id', settings.user_id);
    }

    setMessage(formatImportSummary(results));

    await load();
    setShowConfirm(false);
  };

  if (!settings) return <p>{ui.loading}</p>;

  return (
    <div className="space-y-7 sm:space-y-8">
      <section>
        <p className="micro-label">{ui.settings}</p>
        <h1 className="mt-3 text-4xl font-black leading-[0.95] tracking-tighter sm:text-6xl">{ui.settings}</h1>
      </section>

      <section className="divide-y divide-[#ebebeb] rounded-3xl border border-[#ebebeb] bg-white px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3 py-4 text-[11px] font-bold uppercase tracking-[0.15em] sm:py-5 sm:text-sm sm:tracking-[0.2em]">
          {ui.language}
          <select
            value={settings.language ?? 'en'}
            onChange={async (e) => {
              const language = e.target.value as UserSettings['language'];
              await createClient().from('user_settings').update({ language }).eq('user_id', settings.user_id);
              setSettings({ ...settings, language });
            }}
            className="rounded-xl border-0 bg-[#f5f5f7] px-3 py-2 text-[11px] sm:text-xs"
          >
            <option value="en">English</option>
            <option value="ja">Japanese</option>
          </select>
        </div>
        <div className="flex items-center justify-between gap-3 py-4 text-[11px] font-bold uppercase tracking-[0.15em] sm:py-5 sm:text-sm sm:tracking-[0.2em]">
          {ui.weekStart}
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
        <button className="tap-active flex w-full items-center justify-between py-4 text-left text-[11px] font-bold uppercase tracking-[0.15em] sm:py-5 sm:text-sm sm:tracking-[0.2em]" onClick={onExport}>{ui.exportJson} <span>›</span></button>
        <button
          className="tap-active flex w-full items-center justify-between py-4 text-left text-[11px] font-bold uppercase tracking-[0.15em] sm:py-5 sm:text-sm sm:tracking-[0.2em]"
          onClick={() => {
            setRunMigrationAfterImport(false);
            setShowConfirm(true);
          }}
        >
          {ui.importJson} <span>›</span>
        </button>
        {!settings.migration_done && (
          <button
            className="tap-active flex w-full items-center justify-between py-4 text-left text-[11px] font-bold uppercase tracking-[0.15em] sm:py-5 sm:text-sm sm:tracking-[0.2em]"
            onClick={() => {
              setRunMigrationAfterImport(true);
              setShowConfirm(true);
            }}
          >
            {ui.importLegacy} <span>›</span>
          </button>
        )}
      </section>

      <textarea className="min-h-64 w-full rounded-3xl border-0 bg-[#f5f5f7] p-4 text-sm sm:min-h-72 sm:p-5" value={payload} onChange={(e) => setPayload(e.target.value)} placeholder={ui.jsonData} />

      {hasPayload && (
        <section className="rounded-3xl border border-[#ebebeb] bg-white p-4 text-sm">
          <p className="font-bold">{ui.preflight}</p>
          {validation.ok && validation.parsed ? (
            <ul className="mt-2 space-y-1 text-[#666]">
              <li>habits: {validation.parsed.habits.length} items</li>
              <li>entries: {validation.parsed.entries.length} items</li>
              <li>user_settings: {validation.parsed.user_settings ? ui.yes : ui.no}</li>
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
          <p className="text-sm font-bold">{ui.confirm}</p>
          <p className="mt-2 text-xs text-[#666]">{ui.note}</p>
          <div className="mt-4 flex gap-2">
            <button className="tap-active rounded-2xl bg-black px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white disabled:opacity-40" disabled={!validation.ok} onClick={() => void executeImport(runMigrationAfterImport)}>{ui.run}</button>
            <button className="tap-active rounded-2xl bg-[#f5f5f7] px-4 py-2 text-xs font-bold uppercase tracking-[0.2em]" onClick={() => setShowConfirm(false)}>{ui.cancel}</button>
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
