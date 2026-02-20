import { Entry, Habit, UserSettings } from '@/types/domain';

export type ImportPayload = {
  habits: Habit[];
  entries: Entry[];
  user_settings?: Partial<UserSettings>;
};

export type ImportValidationResult = {
  ok: boolean;
  errors: string[];
  parsed?: ImportPayload;
};

const MAX_IMPORT_ITEMS = 10000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateImportPayload(rawPayload: string): ImportValidationResult {
  let parsedUnknown: unknown;
  try {
    parsedUnknown = JSON.parse(rawPayload);
  } catch {
    return { ok: false, errors: ['Invalid JSON syntax.'] };
  }

  if (!isRecord(parsedUnknown)) {
    return { ok: false, errors: ['Top-level JSON value must be an object.'] };
  }

  const data = parsedUnknown as {
    habits?: unknown;
    entries?: unknown;
    user_settings?: unknown;
  };

  const errors: string[] = [];

  if (!Array.isArray(data.habits)) {
    errors.push('habits must be an array.');
  }

  if (!Array.isArray(data.entries)) {
    errors.push('entries must be an array.');
  }

  if (data.user_settings !== undefined && !isRecord(data.user_settings)) {
    errors.push('user_settings must be an object.');
  }

  if (Array.isArray(data.habits) && data.habits.some((habit) => !isRecord(habit))) {
    errors.push('Each item in habits must be an object.');
  }

  if (Array.isArray(data.entries) && data.entries.some((entry) => !isRecord(entry))) {
    errors.push('Each item in entries must be an object.');
  }

  if (Array.isArray(data.habits) && data.habits.length > MAX_IMPORT_ITEMS) {
    errors.push(`habits must contain at most ${MAX_IMPORT_ITEMS} items.`);
  }

  if (Array.isArray(data.entries) && data.entries.length > MAX_IMPORT_ITEMS) {
    errors.push(`entries must contain at most ${MAX_IMPORT_ITEMS} items.`);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors: [],
    parsed: {
      habits: (data.habits ?? []) as Habit[],
      entries: (data.entries ?? []) as Entry[],
      user_settings: data.user_settings as Partial<UserSettings> | undefined,
    },
  };
}
