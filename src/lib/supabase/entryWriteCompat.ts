import type { PostgrestError } from '@supabase/supabase-js';

const UPSERT_CONFLICT_FALLBACK_CODE = '42P10';

const CONFLICT_INFERENCE_PATTERN = /on\s+conflict/i;
const UNIQUE_CONSTRAINT_INFERENCE_PATTERN = /(no|there is no)\s+unique\s+or\s+exclusion\s+constraint\s+matching/i;

export function shouldFallbackEntryUpsert(error: PostgrestError): boolean {
  if (error.code === UPSERT_CONFLICT_FALLBACK_CODE) return true;

  const searchSpace = [error.message, error.details, error.hint]
    .filter((value): value is string => Boolean(value))
    .join(' ');

  return CONFLICT_INFERENCE_PATTERN.test(searchSpace)
    && UNIQUE_CONSTRAINT_INFERENCE_PATTERN.test(searchSpace);
}
