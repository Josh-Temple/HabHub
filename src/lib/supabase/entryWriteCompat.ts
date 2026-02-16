import type { PostgrestError } from '@supabase/supabase-js';

const UPSERT_CONFLICT_FALLBACK_CODE = '42P10';
const UNDEFINED_COLUMN_CODE = '42703';

const CONFLICT_INFERENCE_PATTERN = /on\s+conflict/i;
const UNIQUE_CONSTRAINT_INFERENCE_PATTERN = /(no|there is no)\s+unique\s+or\s+exclusion\s+constraint\s+matching/i;
const LEGACY_COMPLETED_COLUMN_PATTERN = /column\s+"completed"\s+of\s+relation\s+"entries"\s+does\s+not\s+exist/i;

export function shouldFallbackEntryUpsert(error: PostgrestError): boolean {
  if (error.code === UPSERT_CONFLICT_FALLBACK_CODE) return true;

  const searchSpace = [error.message, error.details, error.hint]
    .filter((value): value is string => Boolean(value))
    .join(' ');

  return CONFLICT_INFERENCE_PATTERN.test(searchSpace)
    && UNIQUE_CONSTRAINT_INFERENCE_PATTERN.test(searchSpace);
}

export function shouldFallbackEntryCompletedColumn(error: PostgrestError): boolean {
  if (error.code !== UNDEFINED_COLUMN_CODE) return false;

  const searchSpace = [error.message, error.details, error.hint]
    .filter((value): value is string => Boolean(value))
    .join(' ');

  return LEGACY_COMPLETED_COLUMN_PATTERN.test(searchSpace);
}
