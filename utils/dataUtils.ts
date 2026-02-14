
import { AppData, Habit, Entry } from '../types';

export const STORAGE_KEY_V2 = 'habhub_data_v2';
export const STORAGE_KEY_V1 = 'habhub_data_v1';

// --- Date Helpers ---

/**
 * Returns a YYYY-MM-DD string based on LOCAL time.
 * Using toISOString() is risky because it uses UTC.
 */
export const getDateKey = (date: Date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDayName = (dateStr: string) => {
  // Parse YYYY-MM-DD manually to avoid timezone shifts
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
};

// Get the date key range for the current week (Monday start)
const getCurrentWeekRange = (dateKey: string): string[] => {
  const [y, m, d] = dateKey.split('-').map(Number);
  const current = new Date(y, m - 1, d);
  
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(current.setDate(diff));
  
  const keys = [];
  for (let i = 0; i < 7; i++) {
    const next = new Date(monday);
    next.setDate(monday.getDate() + i);
    keys.push(getDateKey(next));
  }
  return keys;
};

// Get the date key range for the current month
const getCurrentMonthRange = (dateKey: string): string[] => {
  const [y, m, _] = dateKey.split('-').map(Number);
  const keys = [];
  const daysInMonth = new Date(y, m, 0).getDate();
  
  for (let i = 1; i <= daysInMonth; i++) {
     const date = new Date(y, m - 1, i);
     keys.push(getDateKey(date));
  }
  return keys;
};

// --- Logic Helpers ---

// Calculate how many times a habit has been completed within its period (week/month)
export const getPeriodProgress = (habit: Habit, entries: Entry[], dateKey: string): { current: number, target: number } => {
  if (!habit.targetIntervalCount) return { current: 0, target: 0 };
  
  let rangeKeys: string[] = [];
  if (habit.frequency === 'weekly') {
    rangeKeys = getCurrentWeekRange(dateKey);
  } else if (habit.frequency === 'monthly') {
    rangeKeys = getCurrentMonthRange(dateKey);
  }

  // Count how many entries in this range meet the daily goal
  const completedCount = entries.filter(e => 
    e.habitId === habit.id && 
    rangeKeys.includes(e.dateKey) && 
    e.count >= habit.goal
  ).length;

  return { current: completedCount, target: habit.targetIntervalCount };
};

export const isHabitDue = (habit: Habit, dateKey: string, entries: Entry[] = []): boolean => {
  if (habit.archived) return false;

  // Construct date safely from key
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);

  // Don't show habits created in the future (edge case)
  const createdAt = new Date(habit.createdAt);
  createdAt.setHours(0, 0, 0, 0);
  if (createdAt > date) return false;

  // One-off Task Logic
  if (habit.frequency === 'once') {
    return habit.targetDate === dateKey;
  }

  if (habit.frequency === 'daily') return true;
  
  // Flexible Frequency Logic (Weekly/Monthly with target count)
  if (habit.targetIntervalCount && habit.targetIntervalCount > 0) {
     const { current, target } = getPeriodProgress(habit, entries, dateKey);
     
     // If we haven't met the target yet, it is due.
     if (current < target) return true;
     
     // If we HAVE met the target, check if we did it TODAY.
     // If we did it today, we still want to show it (as completed).
     // If we didn't do it today but met the target, hide it.
     const entryToday = entries.find(e => e.habitId === habit.id && e.dateKey === dateKey);
     return !!(entryToday && entryToday.count > 0);
  }

  // Specific Day Logic
  if (habit.frequency === 'weekly') {
    // 0=Sun, 1=Mon...
    return habit.weekDays?.includes(date.getDay()) ?? false;
  }
  
  if (habit.frequency === 'monthly') {
    // Standard days 1-31
    if (habit.monthDays?.includes(date.getDate())) return true;
    
    // "Last Day" Logic (We use 32 to represent Last Day)
    if (habit.monthDays?.includes(32)) {
      // Check if tomorrow is the 1st of the next month
      const nextDay = new Date(y, m - 1, d + 1);
      if (nextDay.getDate() === 1) return true;
    }
    return false;
  }
  
  return false;
};

export const getHabitSubtitle = (habit: Habit): string => {
  if (habit.targetIntervalCount) {
    const times = habit.targetIntervalCount;
    const unit = habit.frequency === 'weekly' ? 'Week' : 'Month';
    return `${times}x / ${unit}`;
  }

  if (habit.frequency === 'daily') return 'Daily Routine';
  if (habit.frequency === 'weekly') return 'Weekly Ritual';
  if (habit.frequency === 'monthly') return 'Monthly Target';
  if (habit.frequency === 'once') return 'Single Task';
  return 'Habit';
};

// --- Storage & Migration ---

const INITIAL_DATA: AppData = {
  version: 2,
  updatedAt: new Date().toISOString(),
  settings: { weekStartsOn: 'monday' },
  habits: [
    {
      id: '1',
      title: 'Morning Meditation',
      goal: 1,
      frequency: 'daily',
      color: '#000000',
      icon: 'self_improvement',
      createdAt: new Date().toISOString(),
      archived: false
    },
    {
      id: '2',
      title: 'Deep Work',
      goal: 1,
      frequency: 'daily',
      color: '#FF3B30',
      icon: 'bolt',
      createdAt: new Date().toISOString(),
      archived: false
    }
  ],
  entries: []
};

export const loadData = (): AppData => {
  try {
    const v2 = localStorage.getItem(STORAGE_KEY_V2);
    if (v2) {
      const parsed = JSON.parse(v2);
      if (parsed.version === 2 && Array.isArray(parsed.habits)) {
        return parsed;
      }
    }

    // Migration V1 -> V2
    const v1 = localStorage.getItem(STORAGE_KEY_V1);
    if (v1) {
      console.log("Migrating V1 data to V2...");
      const v1Habits = JSON.parse(v1);
      const todayKey = getDateKey();
      
      const newHabits: Habit[] = v1Habits.map((h: any) => ({
        id: h.id,
        title: h.title,
        goal: h.goal || 1,
        frequency: h.frequency,
        weekDays: h.weekDays || [],
        monthDays: h.monthDays || [],
        color: h.color || '#000000',
        icon: h.icon || 'stat_0',
        externalUrl: h.externalUrl,
        createdAt: new Date().toISOString(),
        archived: false
      }));

      const newEntries: Entry[] = [];
      v1Habits.forEach((h: any) => {
        if (h.current > 0) {
          newEntries.push({
            habitId: h.id,
            dateKey: todayKey,
            count: h.current,
            updatedAt: new Date().toISOString()
          });
        }
      });

      return {
        ...INITIAL_DATA,
        habits: newHabits,
        entries: newEntries
      };
    }
    
    return INITIAL_DATA;
  } catch (e) {
    console.error("Data load failed, resetting to initial", e);
    return INITIAL_DATA;
  }
};

export const saveData = (data: AppData) => {
  try {
    const toSave = { ...data, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(toSave));
  } catch (e) {
    console.error("Save failed", e);
  }
};

// --- Analysis Calculations ---

export const calculateStats = (habits: Habit[], entries: Entry[]) => {
  const now = new Date();
  // Reset time to avoid drift during loop
  now.setHours(12, 0, 0, 0); 
  const todayKey = getDateKey(new Date()); // Use separate new Date for exact today key
  
  // 1. Consistency (Last 30 Days)
  let dueCount = 0;
  let completedCount = 0;
  
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const k = getDateKey(d);
    
    habits.forEach(h => {
      // Exclude 'once' tasks from consistency score to avoid skewing stats with one-offs
      // Also need to be careful with flexible habits, simplified for now to treat them as due if incomplete
      if (h.frequency !== 'once' && isHabitDue(h, k, entries)) {
        dueCount++;
        const entry = entries.find(e => e.habitId === h.id && e.dateKey === k);
        if (entry && entry.count >= h.goal) {
          completedCount++;
        }
      }
    });
  }
  
  const consistency = dueCount === 0 ? 0 : Math.round((completedCount / dueCount) * 100);

  // 2. Current Streak (Momentum)
  // Counts consecutive days (going backwards) where ALL due habits were completed.
  let streak = 0;
  
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const k = getDateKey(d);
    
    // Only check recurring habits for streaks
    const dueHabits = habits.filter(h => h.frequency !== 'once' && isHabitDue(h, k, entries));
    
    // If no habits due this day, we generally don't break streak, but don't add to it?
    // Minimalist approach: Skip days with no habits (weekend gaps).
    if (dueHabits.length === 0) continue; 
    
    const allDone = dueHabits.every(h => {
      const entry = entries.find(e => e.habitId === h.id && e.dateKey === k);
      return entry && entry.count >= h.goal;
    });

    if (allDone) {
      streak++;
    } else {
      // If it's today and not done yet, don't break the streak from yesterday.
      // But if it's today and done, we incremented above.
      // If it's today and NOT done, we just stop checking forward, streak is yesterday's streak.
      if (k === todayKey) {
        continue; // Try yesterday
      } else {
        break; // Streak broken
      }
    }
  }

  // 3. Weekly Activity (Last 7 Days)
  // Mapping daily performance to bars
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const k = getDateKey(d);
    
    const dueHabits = habits.filter(h => isHabitDue(h, k, entries));
    let val = 0;
    if (dueHabits.length > 0) {
      const done = dueHabits.filter(h => {
        const entry = entries.find(e => e.habitId === h.id && e.dateKey === k);
        return entry && entry.count >= h.goal;
      }).length;
      val = Math.round((done / dueHabits.length) * 100);
    }
    last7Days.push({ day: getDayName(k), val });
  }

  // 4. Heatmap Data (Last 119 days - roughly 4 months)
  const heatmapData = [];
  for (let i = 118; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const k = getDateKey(d);
    
    const dueHabits = habits.filter(h => isHabitDue(h, k, entries));
    let intensity = 0;
    
    if (dueHabits.length > 0) {
      const done = dueHabits.filter(h => {
        const entry = entries.find(e => e.habitId === h.id && e.dateKey === k);
        return entry && entry.count >= h.goal;
      }).length;
      const pct = done / dueHabits.length;
      if (pct === 0) intensity = 0;
      else if (pct <= 0.25) intensity = 1;
      else if (pct <= 0.5) intensity = 2;
      else if (pct <= 0.75) intensity = 3;
      else intensity = 4;
    }
    heatmapData.push(intensity);
  }

  return { consistency, streak, last7Days, heatmapData };
};
