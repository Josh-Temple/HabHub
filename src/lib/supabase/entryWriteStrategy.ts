import type { PostgrestError } from '@supabase/supabase-js';
import { shouldFallbackEntryCompletedColumn, shouldFallbackEntryUpsert } from './entryWriteCompat';

export type EntryWriteValues = {
  count: number;
  completed?: boolean;
};

export type EntryWriteDriver = {
  upsert: (values: EntryWriteValues) => Promise<PostgrestError | null>;
  update: (values: EntryWriteValues) => Promise<{ error: PostgrestError | null; updated: boolean }>;
  insert: (values: EntryWriteValues) => Promise<PostgrestError | null>;
};

export type EntryWriteFailureStage = 'upsert' | 'update' | 'insert' | 'retry-update';

export type EntryWriteResult =
  | { ok: true; usedLegacyPayload: boolean }
  | { ok: false; error: PostgrestError; stage: EntryWriteFailureStage; usedLegacyPayload: boolean };

async function writeWithValues(driver: EntryWriteDriver, values: EntryWriteValues): Promise<{ ok: true } | { ok: false; error: PostgrestError; stage: EntryWriteFailureStage }> {
  const upsertError = await driver.upsert(values);
  if (!upsertError) return { ok: true };

  if (!shouldFallbackEntryUpsert(upsertError)) {
    return { ok: false, error: upsertError, stage: 'upsert' };
  }

  const { error: updateError, updated } = await driver.update(values);
  if (updateError) {
    return { ok: false, error: updateError, stage: 'update' };
  }

  if (updated) return { ok: true };

  const insertError = await driver.insert(values);
  if (!insertError) return { ok: true };

  if (insertError.code !== '23505') {
    return { ok: false, error: insertError, stage: 'insert' };
  }

  const retryUpdate = await driver.update(values);
  if (retryUpdate.error) {
    return { ok: false, error: retryUpdate.error, stage: 'retry-update' };
  }

  return { ok: true };
}

export async function writeEntryWithCompat(driver: EntryWriteDriver, values: EntryWriteValues, legacyValues: EntryWriteValues): Promise<EntryWriteResult> {
  const primaryResult = await writeWithValues(driver, values);
  if (primaryResult.ok) {
    return { ok: true, usedLegacyPayload: false };
  }

  if (!shouldFallbackEntryCompletedColumn(primaryResult.error)) {
    return {
      ok: false,
      error: primaryResult.error,
      stage: primaryResult.stage,
      usedLegacyPayload: false,
    };
  }

  const legacyResult = await writeWithValues(driver, legacyValues);
  if (legacyResult.ok) {
    return { ok: true, usedLegacyPayload: true };
  }

  return {
    ok: false,
    error: legacyResult.error,
    stage: legacyResult.stage,
    usedLegacyPayload: true,
  };
}
