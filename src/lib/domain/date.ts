export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dateKeyToDate(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function startOfWeek(dateKey: string, weekStart: number): string {
  const date = dateKeyToDate(dateKey);
  const dow = date.getDay();
  const diff = (dow - weekStart + 7) % 7;
  date.setDate(date.getDate() - diff);
  return toDateKey(date);
}

export function isLastDayOfMonth(dateKey: string): boolean {
  const date = dateKeyToDate(dateKey);
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return next.getMonth() !== date.getMonth();
}

export function getMonthBucket(dateKey: string): string {
  return dateKey.slice(0, 7);
}
