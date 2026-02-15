import { describe, expect, test } from 'vitest';
import { isEntryDone, nextCountFromBump, nextCountFromToggle } from './entryProgress';

describe('entryProgress', () => {
  const habit = { goal_count: 3 };

  test('isEntryDone returns true when completed flag is true', () => {
    expect(isEntryDone({ count: 0, completed: true }, habit)).toBe(true);
  });

  test('isEntryDone returns true when count reaches goal without completed flag', () => {
    expect(isEntryDone({ count: 3, completed: false }, habit)).toBe(true);
  });

  test('nextCountFromToggle resets to zero when done by count', () => {
    expect(nextCountFromToggle({ count: 3, completed: false }, habit)).toBe(0);
  });

  test('nextCountFromToggle sets count to goal when not done', () => {
    expect(nextCountFromToggle({ count: 1, completed: false }, habit)).toBe(3);
  });

  test('nextCountFromBump never drops below zero', () => {
    expect(nextCountFromBump({ count: 0, completed: false }, habit, -1)).toBe(0);
  });
});
