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

  it('returns errors when array items are not objects', () => {
    const result = validateImportPayload(JSON.stringify({ habits: [1], entries: ['x'] }));
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('Each item in habits must be an object.');
    expect(result.errors).toContain('Each item in entries must be an object.');
  });

  it('returns parsed payload for valid shape', () => {
    const result = validateImportPayload(JSON.stringify({ habits: [], entries: [], user_settings: { week_start: 1, language: 'en' } }));
    expect(result.ok).toBe(true);
    expect(result.parsed?.habits).toEqual([]);
    expect(result.parsed?.entries).toEqual([]);
  });
});
