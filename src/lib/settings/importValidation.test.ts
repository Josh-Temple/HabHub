import { describe, expect, it } from 'vitest';
import { validateImportPayload } from '@/lib/settings/importValidation';

describe('validateImportPayload', () => {
  it('returns errors for invalid JSON', () => {
    const result = validateImportPayload('{bad json');
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('Invalid JSON syntax.');
  });

  it('returns errors for invalid shape', () => {
    const result = validateImportPayload(JSON.stringify({ habits: {}, entries: [] }));
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('habits must be an array.');
  });

  it('returns parsed payload for valid restore shape', () => {
    const result = validateImportPayload(
      JSON.stringify({ habits: [], entries: [], user_settings: { week_start: 1, language: 'en' } }),
    );
    expect(result.ok).toBe(true);
    expect(result.parsed?.habits).toEqual([]);
    expect(result.parsed?.entries).toEqual([]);
  });

  it('normalizes legacy migration payload', () => {
    const result = validateImportPayload(
      JSON.stringify({
        settings: { weekStartsOn: 'sunday' },
        habits: [{ id: 'h1', title: 'Walk', goal: 2, frequency: 'weekly', weekDays: [1, 3], color: '#111111', createdAt: '2026-01-01T00:00:00.000Z', archived: false }],
        entries: [{ habitId: 'h1', dateKey: '2026-01-02', count: 1 }],
      }),
      'legacy_migration',
    );

    expect(result.ok).toBe(true);
    expect(result.parsed?.habits[0].name).toBe('Walk');
    expect(result.parsed?.habits[0].frequency).toBe('weekly_specific');
    expect(result.parsed?.entries[0].habit_id).toBe('h1');
    expect(result.parsed?.user_settings?.week_start).toBe(0);
  });
});
