import { describe, expect, test } from 'vitest';
import type { PostgrestError } from '@supabase/supabase-js';
import { writeEntryWithCompat, type EntryWriteDriver, type EntryWriteValues } from './entryWriteStrategy';

function createError(overrides: Partial<PostgrestError>): PostgrestError {
  return {
    code: 'XX000',
    details: null,
    hint: null,
    message: 'unknown error',
    ...overrides,
  };
}

function createDriver(script: {
  upsert?: Array<PostgrestError | null>;
  update?: Array<{ error: PostgrestError | null; updated: boolean }>;
  insert?: Array<PostgrestError | null>;
}) {
  const calls: Array<{ op: 'upsert' | 'update' | 'insert'; values: EntryWriteValues }> = [];

  const queues = {
    upsert: [...(script.upsert ?? [])],
    update: [...(script.update ?? [])],
    insert: [...(script.insert ?? [])],
  };

  const driver: EntryWriteDriver = {
    upsert: async (values) => {
      calls.push({ op: 'upsert', values });
      return queues.upsert.shift() ?? null;
    },
    update: async (values) => {
      calls.push({ op: 'update', values });
      return queues.update.shift() ?? { error: null, updated: false };
    },
    insert: async (values) => {
      calls.push({ op: 'insert', values });
      return queues.insert.shift() ?? null;
    },
  };

  return { driver, calls };
}

describe('writeEntryWithCompat', () => {
  test('succeeds on primary upsert path', async () => {
    const { driver, calls } = createDriver({ upsert: [null] });
    const values = { count: 2, completed: true };

    const result = await writeEntryWithCompat(driver, values, { count: 2 });

    expect(result).toEqual({ ok: true, usedLegacyPayload: false });
    expect(calls).toEqual([{ op: 'upsert', values }]);
  });

  test('falls back to update/insert on 42P10 and succeeds', async () => {
    const { driver, calls } = createDriver({
      upsert: [createError({ code: '42P10' })],
      update: [{ error: null, updated: false }],
      insert: [null],
    });
    const values = { count: 1, completed: false };

    const result = await writeEntryWithCompat(driver, values, { count: 1 });

    expect(result).toEqual({ ok: true, usedLegacyPayload: false });
    expect(calls.map((call) => call.op)).toEqual(['upsert', 'update', 'insert']);
  });

  test('retries update when fallback insert hits duplicate key', async () => {
    const { driver, calls } = createDriver({
      upsert: [createError({ code: '42P10' })],
      update: [{ error: null, updated: false }, { error: null, updated: true }],
      insert: [createError({ code: '23505', message: 'duplicate key value violates unique constraint' })],
    });

    const result = await writeEntryWithCompat(driver, { count: 3, completed: true }, { count: 3 });

    expect(result).toEqual({ ok: true, usedLegacyPayload: false });
    expect(calls.map((call) => call.op)).toEqual(['upsert', 'update', 'insert', 'update']);
  });

  test('switches to legacy payload when completed column is missing', async () => {
    const legacyColumnError = createError({
      code: '42703',
      message: 'column "completed" of relation "entries" does not exist',
    });

    const { driver, calls } = createDriver({ upsert: [legacyColumnError, null] });

    const result = await writeEntryWithCompat(driver, { count: 1, completed: true }, { count: 1 });

    expect(result).toEqual({ ok: true, usedLegacyPayload: true });
    expect(calls).toEqual([
      { op: 'upsert', values: { count: 1, completed: true } },
      { op: 'upsert', values: { count: 1 } },
    ]);
  });

  test('returns stage and legacy flag when both payloads fail', async () => {
    const legacyColumnError = createError({
      code: '42703',
      message: 'column "completed" of relation "entries" does not exist',
    });
    const deniedError = createError({ code: '42501', message: 'permission denied for table entries' });
    const { driver } = createDriver({ upsert: [legacyColumnError, deniedError] });

    const result = await writeEntryWithCompat(driver, { count: 1, completed: true }, { count: 1 });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.stage).toBe('upsert');
    expect(result.usedLegacyPayload).toBe(true);
    expect(result.error.code).toBe('42501');
  });
});
