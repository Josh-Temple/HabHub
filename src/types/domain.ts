export type Frequency = 'daily' | 'weekly_specific' | 'monthly_specific' | 'flexible' | 'once';

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  frequency: Frequency;
  goal_count: number;
  schedule: {
    weekDays?: number[];
    monthDays?: number[];
    targetIntervalCount?: number;
    targetDate?: string;
    interval?: 'week' | 'month';
    accentColor?: string;
  };
  external_url: string | null;
  archived: boolean;
  sort_order: number;
  created_at: string;
};

export type Entry = {
  user_id: string;
  habit_id: string;
  date_key: string;
  count: number;
  completed: boolean;
};

export type UserSettings = {
  user_id: string;
  week_start: number;
  language: 'en' | 'ja';
  migration_done: boolean;
};
