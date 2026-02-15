import type { PostgrestError } from '@supabase/supabase-js';

const LEGACY_TITLE_NOT_NULL_FRAGMENT = 'null value in column "title" of relation "habits" violates not-null constraint';

export function isLegacyTitleNotNullError(error: PostgrestError): boolean {
  return error.message.includes(LEGACY_TITLE_NOT_NULL_FRAGMENT)
    || (error.code === '23502' && error.message.includes('"title"'));
}

type HabitMutationResult = { error: PostgrestError | null };

export async function withLegacyTitleFallback(
  runPrimary: () => Promise<HabitMutationResult>,
  runFallback: () => Promise<HabitMutationResult>
): Promise<PostgrestError | null> {
  const primary = await runPrimary();
  if (!primary.error) return null;
  if (!isLegacyTitleNotNullError(primary.error)) return primary.error;

  const fallback = await runFallback();
  return fallback.error;
}

