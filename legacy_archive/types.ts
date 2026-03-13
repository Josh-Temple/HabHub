
export type HabitFrequency = 'daily' | 'weekly' | 'monthly' | 'once';

export interface Habit {
  id: string;
  title: string;
  goal: number;
  frequency: HabitFrequency;
  weekDays?: number[]; // 0=Sunday, 1=Monday...
  monthDays?: number[]; // 1-31, 32=Last Day
  targetIntervalCount?: number; // New: For "3 times per week" style habits. If set, overrides specific days.
  targetDate?: string; // YYYY-MM-DD for 'once' frequency
  color: string;
  icon: string;
  externalUrl?: string;
  createdAt: string;
  archived: boolean;
}

export interface Entry {
  habitId: string;
  dateKey: string; // YYYY-MM-DD
  count: number;
  updatedAt: string;
}

export interface AppSettings {
  weekStartsOn: 'monday' | 'sunday';
}

export interface AppData {
  version: number;
  updatedAt: string;
  settings: AppSettings;
  habits: Habit[];
  entries: Entry[];
}

export interface DailyStats {
  completed: number;
  total: number;
  quote: string;
}
