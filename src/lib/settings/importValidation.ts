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

export function validateImportPayload(rawPayload: string): ImportValidationResult {
  let parsedUnknown: unknown;
  try {
    parsedUnknown = JSON.parse(rawPayload);
  } catch {
    return { ok: false, errors: ['JSONの構文が不正です。'] };
  }

  if (!parsedUnknown || typeof parsedUnknown !== 'object') {
    return { ok: false, errors: ['JSONのトップレベルはオブジェクトである必要があります。'] };
  }

  const data = parsedUnknown as {
    habits?: Habit[];
    entries?: Entry[];
    user_settings?: Partial<UserSettings>;
  };

  const errors: string[] = [];

  if (!Array.isArray(data.habits)) {
    errors.push('habits は配列である必要があります。');
  }

  if (!Array.isArray(data.entries)) {
    errors.push('entries は配列である必要があります。');
  }

  if (data.user_settings && typeof data.user_settings !== 'object') {
    errors.push('user_settings はオブジェクトである必要があります。');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors: [],
    parsed: {
      habits: data.habits ?? [],
      entries: data.entries ?? [],
      user_settings: data.user_settings,
    },
  };
}
