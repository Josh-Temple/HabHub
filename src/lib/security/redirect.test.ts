import { describe, expect, it } from 'vitest';
import { sanitizeAppRedirectPath } from '@/lib/security/redirect';

describe('sanitizeAppRedirectPath', () => {
  it('falls back for empty values', () => {
    expect(sanitizeAppRedirectPath(undefined)).toBe('/app/today');
    expect(sanitizeAppRedirectPath(null)).toBe('/app/today');
    expect(sanitizeAppRedirectPath('')).toBe('/app/today');
  });

  it('allows local app paths', () => {
    expect(sanitizeAppRedirectPath('/app/today')).toBe('/app/today');
    expect(sanitizeAppRedirectPath('/app/habits?id=1')).toBe('/app/habits?id=1');
  });

  it('blocks non-local or suspicious paths', () => {
    expect(sanitizeAppRedirectPath('https://evil.example')).toBe('/app/today');
    expect(sanitizeAppRedirectPath('//evil.example')).toBe('/app/today');
    expect(sanitizeAppRedirectPath('/\\evil')).toBe('/app/today');
    expect(sanitizeAppRedirectPath('/login')).toBe('/app/today');
  });
});
