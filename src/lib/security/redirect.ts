const DEFAULT_APP_PATH = '/app/today';
const SAFE_PREFIX = '/app';

export function sanitizeAppRedirectPath(value: string | null | undefined): string {
  if (!value) return DEFAULT_APP_PATH;
  if (!value.startsWith('/')) return DEFAULT_APP_PATH;
  if (value.startsWith('//')) return DEFAULT_APP_PATH;
  if (value.includes('\\')) return DEFAULT_APP_PATH;
  if (!value.startsWith(SAFE_PREFIX)) return DEFAULT_APP_PATH;
  return value;
}
