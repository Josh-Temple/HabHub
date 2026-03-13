
import React from 'react';
import { Habit } from '../types';

interface HabitItemProps {
  habit: Habit;
  current: number;
  isDone: boolean;
  onLog: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onLaunch: (url: string) => void;
  periodProgress?: { current: number, target: number }; // Optional: For flexible habits
}

export const HabitItem: React.FC<HabitItemProps> = ({ 
  habit, current, isDone, onLog, onToggleComplete, onLaunch, periodProgress
}) => {
  const accentColor = habit.color || '#000000';
  const isSingleGoal = habit.goal === 1;

  // Ring Calculation
  const size = 40; 
  const strokeWidth = 3; 
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate progress (cap at 1 to prevent weird loop overlap if overachieved)
  const progressRatio = Math.min(current / habit.goal, 1);
  const strokeDashoffset = circumference - (progressRatio * circumference);

  // Heuristic: Material icons are typically longer strings. Emojis are 1-2 chars.
  const isMaterialIcon = habit.icon && habit.icon.length > 2;

  // Determine subtitle text
  let subtitle = '';
  if (isDone) {
      subtitle = 'Completed';
  } else if (periodProgress) {
      // It's a flexible habit
      const unit = habit.frequency === 'weekly' ? 'Week' : 'Month';
      subtitle = `${unit} Goal: ${periodProgress.current} / ${periodProgress.target}`;
  } else if (isSingleGoal) {
      subtitle = 'Tap to complete';
  } else {
      subtitle = `${current} / ${habit.goal} completed`;
  }

  return (
    <div className="group flex items-center justify-between py-5 border-b border-border-gray last:border-none transition-all">
      {/* Left Content: Text Info */}
      <div 
        onClick={() => !isDone && onLog(habit.id)}
        className="flex-1 cursor-pointer active:opacity-40 transition-opacity pr-6"
      >
        <div className="flex items-center gap-4">
          <h4 className={`text-xl font-bold tracking-tight transition-all duration-700 ${isDone ? 'text-dim-gray opacity-40 line-through' : 'text-pure-black'}`}>
            {habit.title}
          </h4>
          {habit.externalUrl && !isDone && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onLaunch(habit.externalUrl!);
              }}
              className="p-2 -my-2 text-dim-gray hover:text-pure-black transition-colors"
              aria-label="Open link"
            >
              <span className="material-symbols-outlined text-lg">north_east</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          {!isDone && (
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
          )}
          <p className="text-dim-gray text-[10px] font-black uppercase tracking-[0.3em]">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Right Content: Ring UI */}
      <div 
        onClick={() => onToggleComplete(habit.id)}
        className="relative cursor-pointer active:scale-90 transition-transform duration-200"
        style={{ width: size, height: size }}
      >
        {/* SVG Ring */}
        <svg 
          width={size} 
          height={size} 
          className="transform -rotate-90"
        >
          {/* Background Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#EBEBEB"
            strokeWidth={strokeWidth}
          />
          {/* Progress Indicator */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={accentColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Content (Icon or Checkmark) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {isDone ? (
            <span 
              className="material-symbols-outlined text-xl transition-all duration-500 animate-[fadeIn_0.3s_ease-out]"
              style={{ color: accentColor }}
            >
              check
            </span>
          ) : (
            <span 
              className={`${isMaterialIcon ? 'material-symbols-outlined' : ''} text-lg transition-all duration-500`}
              style={{ color: '#EBEBEB' }}
            >
              {habit.icon}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
