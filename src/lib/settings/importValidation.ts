import { Entry, Habit, UserSettings } from '@/types/domain';

export type ImportMode = 'restore' | 'legacy_migration';

export type ImportPayload = {
  habits: Habit[];
  entries: Entry[];
  user_settings?: Partial<UserSettings>;
};

export type ImportValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  parsed?: ImportPayload;
};

const MAX_IMPORT_ITEMS = 10000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJson(rawPayload: string): { ok: true; value: unknown } | { ok: false; errors: string[] } {
  try {
    return { ok: true, value: JSON.parse(rawPayload) };
  } catch {
    return { ok: false, errors: ['Invalid JSON syntax.'] };
  }
}

function validateRestoreShape(value: unknown): ImportValidationResult {
  if (!isRecord(value)) {
    return { ok: false, errors: ['Top-level JSON value must be an object.'], warnings: [] };
  }

  const data = value as {
    habits?: unknown;
    entries?: unknown;
    user_settings?: unknown;
  };

  const errors: string[] = [];

  if (!Array.isArray(data.habits)) errors.push('habits must be an array.');
  if (!Array.isArray(data.entries)) errors.push('entries must be an array.');
  if (data.user_settings !== undefined && !isRecord(data.user_settings)) errors.push('user_settings must be an object.');
  if (Array.isArray(data.habits) && data.habits.some((habit) => !isRecord(habit))) errors.push('Each item in habits must be an object.');
  if (Array.isArray(data.entries) && data.entries.some((entry) => !isRecord(entry))) errors.push('Each item in entries must be an object.');
  if (Array.isArray(data.habits) && data.habits.length > MAX_IMPORT_ITEMS) errors.push(`habits must contain at most ${MAX_IMPORT_ITEMS} items.`);
  if (Array.isArray(data.entries) && data.entries.length > MAX_IMPORT_ITEMS) errors.push(`entries must contain at most ${MAX_IMPORT_ITEMS} items.`);

  if (errors.length > 0) return { ok: false, errors, warnings: [] };

  return {
    ok: true,
    errors: [],
    warnings: [],
    parsed: {
      habits: (data.habits ?? []) as Habit[],
      entries: (data.entries ?? []) as Entry[],
      user_settings: data.user_settings as Partial<UserSettings> | undefined,
    },
  };
}

function normalizeLegacyPayload(value: unknown): ImportValidationResult {
  if (!isRecord(value)) {
    return { ok: false, errors: ['Top-level JSON value must be an object.'], warnings: [] };
  }

  const data = value as { habits?: unknown; entries?: unknown; settings?: unknown };
  if (!Array.isArray(data.habits) || !Array.isArray(data.entries)) {
    return { ok: false, errors: ['Legacy payload must include habits[] and entries[].'], warnings: [] };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  const habits: Habit[] = data.habits.flatMap((item, index) => {
    if (!isRecord(item)) {
      errors.push(`Legacy habit at index ${index} must be an object.`);
      return [];
    }

    const id = typeof item.id === 'string' ? item.id : `legacy-habit-${index}`;
    const title = typeof item.title === 'string' ? item.title : undefined;
    if (!title) {
      errors.push(`Legacy habit at index ${index} is missing title.`);
      return [];
    }

    const frequencyMap: Record<string, Habit['frequency']> = {
      daily: 'daily',
      weekly: 'weekly_specific',
      monthly: 'monthly_specific',
      once: 'once',
    };

    const legacyFrequency = typeof item.frequency === 'string' ? item.frequency : 'daily';
    const frequency = frequencyMap[legacyFrequency] ?? 'daily';
    if (!frequencyMap[legacyFrequency]) {
      warnings.push(`Habit "${title}" has unsupported frequency "${legacyFrequency}" and was set to daily.`);
    }

    const goalCount = typeof item.goal === 'number' && item.goal > 0 ? Math.floor(item.goal) : 1;

    return [{
      id,
      user_id: '',
      name: title,
      description: null,
      frequency,
      goal_count: goalCount,
      schedule: {
        weekDays: Array.isArray(item.weekDays) ? (item.weekDays as number[]) : undefined,
        monthDays: Array.isArray(item.monthDays) ? (item.monthDays as number[]) : undefined,
        targetIntervalCount: typeof item.targetIntervalCount === 'number' ? item.targetIntervalCount : undefined,
        targetDate: typeof item.targetDate === 'string' ? item.targetDate : undefined,
        accentColor: typeof item.color === 'string' ? item.color : undefined,
      },
      external_url: typeof item.externalUrl === 'string' ? item.externalUrl : null,
      archived: Boolean(item.archived),
      sort_order: index,
      created_at: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    }];
  });

  const entries: Entry[] = data.entries.flatMap((item, index) => {
    if (!isRecord(item)) {
      errors.push(`Legacy entry at index ${index} must be an object.`);
      return [];
    }

    if (typeof item.habitId !== 'string' || typeof item.dateKey !== 'string' || typeof item.count !== 'number') {
      errors.push(`Legacy entry at index ${index} is missing habitId/dateKey/count.`);
      return [];
    }

    return [{
      user_id: '',
      habit_id: item.habitId,
      date_key: item.dateKey,
      count: Math.max(0, Math.floor(item.count)),
      completed: false,
    }];
  });

  if (errors.length > 0) return { ok: false, errors, warnings: [] };

  const weekStartsOn = isRecord(data.settings) ? data.settings.weekStartsOn : undefined;
  const user_settings = weekStartsOn === 'sunday' ? { week_start: 0 } : { week_start: 1 };

  return { ok: true, errors: [], warnings, parsed: { habits, entries, user_settings } };
}

export function validateImportPayload(rawPayload: string, mode: ImportMode = 'restore'): ImportValidationResult {
  const parsed = parseJson(rawPayload);
  if (!parsed.ok) return { ok: false, errors: parsed.errors, warnings: [] };

  if (mode === 'legacy_migration') {
    const normalized = normalizeLegacyPayload(parsed.value);
    if (normalized.ok) return normalized;
  }

  return validateRestoreShape(parsed.value);
}
