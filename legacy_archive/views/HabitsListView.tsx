
import React from 'react';
import { Habit } from '../types';
import { getHabitSubtitle } from '../utils/dataUtils';

interface HabitsListViewProps {
  habits: Habit[];
  onEdit: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
}

export const HabitsListView: React.FC<HabitsListViewProps> = ({ habits, onEdit, onMove }) => {
  
  // Heuristic: Material icons are typically ligatures (words) > 2 chars.
  // Emojis are usually 1-2 chars (surrogates).
  const isMaterialIcon = (str: string) => str.length > 2;

  return (
    <div className="fade-in">
      <header className="mb-12">
        <p className="text-[10px] font-black text-dim-gray uppercase tracking-ultra-widest opacity-40 mb-3">Management</p>
        <h1 className="text-5xl font-black tracking-tighter">Inventory</h1>
      </header>

      <div className="space-y-3">
        {habits.map((habit, index) => (
          <div 
            key={habit.id} 
            className="group relative flex items-center gap-4 p-4 bg-white rounded-2xl border border-border-gray transition-all duration-300 hover:border-pure-black hover:shadow-sm"
          >
             {/* Main Clickable Area for Edit */}
             <button 
               onClick={() => onEdit(habit.id)}
               className="flex-1 flex items-center gap-4 text-left min-w-0"
             >
                {/* Visual Anchor (Icon) */}
                <div 
                className="w-12 h-12 shrink-0 rounded-xl bg-light-gray/50 flex items-center justify-center text-pure-black transition-colors group-hover:bg-pure-black group-hover:text-white"
                >
                    <span className={`text-lg ${isMaterialIcon(habit.icon) ? 'material-symbols-outlined' : ''}`}>
                        {habit.icon}
                    </span>
                </div>

                {/* Content info */}
                <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-bold text-base tracking-tight truncate text-pure-black">
                            {habit.title}
                        </h4>
                        <div 
                            className="w-1.5 h-1.5 rounded-full shrink-0 opacity-80" 
                            style={{ backgroundColor: habit.color || '#000000' }} 
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold text-dim-gray uppercase tracking-widest opacity-50 truncate">
                        {getHabitSubtitle(habit)} <span className="mx-1">·</span> {habit.goal} {habit.goal === 1 ? 'Time' : 'Times'}
                        </p>
                    </div>
                </div>
            </button>
            
            {/* Reorder Stack (Compact Pill) */}
            <div className="flex flex-col gap-0.5 bg-light-gray/50 p-0.5 rounded-lg border border-transparent group-hover:border-border-gray transition-colors">
                 <button
                   onClick={(e) => { e.stopPropagation(); onMove(habit.id, 'up'); }}
                   disabled={index === 0}
                   className="w-7 h-6 flex items-center justify-center text-dim-gray hover:text-pure-black hover:bg-white rounded-md disabled:opacity-10 disabled:hover:bg-transparent transition-all"
                   title="Move Up"
                 >
                    <span className="material-symbols-outlined text-sm font-bold">keyboard_arrow_up</span>
                 </button>
                 <button
                   onClick={(e) => { e.stopPropagation(); onMove(habit.id, 'down'); }}
                   disabled={index === habits.length - 1}
                   className="w-7 h-6 flex items-center justify-center text-dim-gray hover:text-pure-black hover:bg-white rounded-md disabled:opacity-10 disabled:hover:bg-transparent transition-all"
                   title="Move Down"
                 >
                    <span className="material-symbols-outlined text-sm font-bold">keyboard_arrow_down</span>
                 </button>
            </div>
          </div>
        ))}

        {habits.length === 0 && (
          <div className="py-20 text-center opacity-40">
            <p className="text-sm font-bold">No habits found.</p>
          </div>
        )}

        <div className="pb-10 pt-6 text-center">
           <p className="text-[9px] font-black text-dim-gray uppercase tracking-widest opacity-10">End of Inventory</p>
        </div>
      </div>
    </div>
  );
};
