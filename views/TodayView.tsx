
import React, { useMemo } from 'react';
import { Habit, Entry } from '../types';
import { HabitItem } from '../components/HabitItem';
import { getDateKey, isHabitDue } from '../utils/dataUtils';

interface TodayViewProps {
  habits: Habit[];
  entries: Entry[];
  completedCount: number;
  onLog: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({ 
  habits, entries, completedCount, onLog, onToggleComplete 
}) => {
  const handleLaunch = (url: string) => window.open(url, '_blank');
  const todayKey = getDateKey();

  // Filter habits to only show those scheduled for today
  const { recurringHabits, oneOffTasks } = useMemo(() => {
    const todayHabits = habits.filter(habit => isHabitDue(habit, todayKey));
    return {
        recurringHabits: todayHabits.filter(h => h.frequency !== 'once'),
        oneOffTasks: todayHabits.filter(h => h.frequency === 'once')
    };
  }, [habits, todayKey]);

  const totalVisible = recurringHabits.length + oneOffTasks.length;

  return (
    <div className="flex flex-col">
      <header className="mb-12">
        <p className="text-[10px] font-black text-dim-gray uppercase tracking-ultra-widest opacity-40 mb-3">Daily Snapshot</p>
        <h1 className="text-5xl font-black tracking-tighter leading-none mb-10">Current Focus</h1>
        
        <div className="flex items-center gap-6 py-8 border-y border-border-gray/50">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tighter tabular-nums leading-none text-pure-black">
              {completedCount < 10 ? `0${completedCount}` : completedCount}
            </span>
            <span className="text-xl font-bold text-dim-gray opacity-20">/ {totalVisible < 10 ? `0${totalVisible}` : totalVisible}</span>
          </div>
          <div className="h-8 w-px bg-border-gray" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-tight text-pure-black">Completed</span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] leading-tight text-dim-gray opacity-40">Today's Progress</span>
          </div>
        </div>
      </header>

      <div className="flex flex-col space-y-12">
        
        {/* Routine Section */}
        {recurringHabits.length > 0 && (
            <div>
                 <h3 className="text-[10px] font-black text-dim-gray uppercase tracking-ultra-widest mb-4 opacity-30">Routine</h3>
                 <div>
                    {recurringHabits.map(habit => {
                    const entry = entries.find(e => e.habitId === habit.id && e.dateKey === todayKey);
                    const current = entry ? entry.count : 0;
                    const isDone = current >= habit.goal;
                    
                    return (
                        <HabitItem 
                        key={habit.id} 
                        habit={habit}
                        current={current}
                        isDone={isDone}
                        onLog={onLog}
                        onToggleComplete={onToggleComplete}
                        onLaunch={handleLaunch}
                        />
                    );
                    })}
                 </div>
            </div>
        )}

        {/* Tasks Section */}
        {oneOffTasks.length > 0 && (
            <div>
                 <h3 className="text-[10px] font-black text-dim-gray uppercase tracking-ultra-widest mb-4 opacity-30">One-off Tasks</h3>
                 <div>
                    {oneOffTasks.map(habit => {
                    const entry = entries.find(e => e.habitId === habit.id && e.dateKey === todayKey);
                    const current = entry ? entry.count : 0;
                    const isDone = current >= habit.goal;
                    
                    return (
                        <HabitItem 
                        key={habit.id} 
                        habit={habit}
                        current={current}
                        isDone={isDone}
                        onLog={onLog}
                        onToggleComplete={onToggleComplete}
                        onLaunch={handleLaunch}
                        />
                    );
                    })}
                 </div>
            </div>
        )}

        {totalVisible === 0 && (
          <div className="py-32 text-center">
            <p className="text-[10px] font-black text-dim-gray uppercase tracking-ultra-widest opacity-10">Nothing Scheduled</p>
          </div>
        )}
      </div>
    </div>
  );
};
