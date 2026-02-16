import { describe, expect, test } from 'vitest';
import type { PostgrestError } from '@supabase/supabase-js';
import { shouldFallbackEntryUpsert } from './entryWriteCompat';

function createError(overrides: Partial<PostgrestError>): PostgrestError {
  return {
    code: 'XX000',
    details: null,
    hint: null,
    message: 'unknown error',
    ...overrides,
  };
}

describe('shouldFallbackEntryUpsert', () => {
  test('returns true for postgres 42P10 conflict inference failure', () => {
    expect(shouldFallbackEntryUpsert(createError({ code: '42P10' }))).toBe(true);
  });

  test('returns true when ON CONFLICT + unique/exclusion mismatch appears in message', () => {
    expect(
      shouldFallbackEntryUpsert(
        createError({ message: 'there is no unique or exclusion constraint matching the ON conflict specification' })
      )
    ).toBe(true);
  });

  test('returns true when conflict inference text is split between details and hint', () => {
    expect(
      shouldFallbackEntryUpsert(
        createError({ details: 'No unique or exclusion constraint matching', hint: 'Please fix ON CONFLICT target' })
      )
    ).toBe(true);
  });

  test('returns false for unrelated errors', () => {
    expect(shouldFallbackEntryUpsert(createError({ code: '42501', message: 'permission denied' }))).toBe(false);
  });

  test('returns false for generic ON CONFLICT errors without inference mismatch context', () => {
    expect(shouldFallbackEntryUpsert(createError({ message: 'ON CONFLICT DO UPDATE command cannot affect row a second time' }))).toBe(false);
  });
});
