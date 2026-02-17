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
    return { ok: false, errors: ['JSONの構文が不正です。'] };
  }

  if (!isRecord(parsedUnknown)) {
    return { ok: false, errors: ['JSONのトップレベルはオブジェクトである必要があります。'] };
  }

  const data = parsedUnknown as {
    habits?: unknown;
    entries?: unknown;
    user_settings?: unknown;
  };

  const errors: string[] = [];

  if (!Array.isArray(data.habits)) {
    errors.push('habits は配列である必要があります。');
  }

  if (!Array.isArray(data.entries)) {
    errors.push('entries は配列である必要があります。');
  }

  if (data.user_settings !== undefined && !isRecord(data.user_settings)) {
    errors.push('user_settings はオブジェクトである必要があります。');
  }

  if (Array.isArray(data.habits) && data.habits.some((habit) => !isRecord(habit))) {
    errors.push('habits の各要素はオブジェクトである必要があります。');
  }

  if (Array.isArray(data.entries) && data.entries.some((entry) => !isRecord(entry))) {
    errors.push('entries の各要素はオブジェクトである必要があります。');
  }

  if (Array.isArray(data.habits) && data.habits.length > MAX_IMPORT_ITEMS) {
    errors.push(`habits は ${MAX_IMPORT_ITEMS} 件以下にしてください。`);
  }

  if (Array.isArray(data.entries) && data.entries.length > MAX_IMPORT_ITEMS) {
    errors.push(`entries は ${MAX_IMPORT_ITEMS} 件以下にしてください。`);
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
