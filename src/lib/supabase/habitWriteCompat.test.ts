import { describe, expect, it } from 'vitest';
import type { PostgrestError } from '@supabase/supabase-js';
import { isLegacyTitleNotNullError } from './habitWriteCompat';

function err(message: string, code = '23502'): PostgrestError {
  return { message, code, details: '', hint: '' };
}

describe('isLegacyTitleNotNullError', () => {
  it('returns true for legacy title not-null violation', () => {
    expect(isLegacyTitleNotNullError(err('null value in column "title" of relation "habits" violates not-null constraint'))).toBe(true);
  });

  it('returns false for unrelated constraint errors', () => {
    expect(isLegacyTitleNotNullError(err('null value in column "name" of relation "habits" violates not-null constraint'))).toBe(false);
  });
});
