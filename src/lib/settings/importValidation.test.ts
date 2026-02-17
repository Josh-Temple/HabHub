import { describe, expect, it } from 'vitest';
import { validateImportPayload } from '@/lib/settings/importValidation';

describe('validateImportPayload', () => {
  it('returns errors for invalid JSON', () => {
    const result = validateImportPayload('{bad json');
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('JSONの構文が不正です。');
  });

  it('returns errors for invalid shape', () => {
    const result = validateImportPayload(JSON.stringify({ habits: {}, entries: [] }));
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('habits は配列である必要があります。');
  });

  it('returns parsed payload for valid shape', () => {
    const result = validateImportPayload(JSON.stringify({ habits: [], entries: [], user_settings: { week_start: 1 } }));
    expect(result.ok).toBe(true);
    expect(result.parsed?.habits).toEqual([]);
    expect(result.parsed?.entries).toEqual([]);
  });
});
