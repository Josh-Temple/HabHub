
import React from 'react';
import { Habit } from '../types';
import { getHabitSubtitle } from '../utils/dataUtils';

interface HabitsListViewProps {
  habits: Habit[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export const HabitsListView: React.FC<HabitsListViewProps> = ({ habits, onDelete, onEdit }) => {
  
  // Heuristic: Material icons are typically ligatures (words) > 2 chars.
  // Emojis are usually 1-2 chars (surrogates).
  const isMaterialIcon = (str: string) => str.length > 2;

  return (
    <div className="fade-in">
      <header className="mb-16">
        <p className="text-[10px] font-black text-dim-gray uppercase tracking-ultra-widest opacity-40 mb-3">Management</p>
        <h1 className="text-5xl font-black tracking-tighter">Inventory</h1>
      </header>

      <div className="space-y-4">
        {habits.map(habit => (
          <div key={habit.id} className="p-8 bg-white rounded-[2rem] border border-border-gray flex items-center justify-between group transition-all hover:border-pure-black/10 hover:bg-light-gray/30">
            <div className="flex items-center gap-6">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center border border-border-gray shadow-sm group-hover:bg-pure-black group-hover:text-white transition-all overflow-hidden relative"
              >
                <span className={`text-xl ${isMaterialIcon(habit.icon) ? 'material-symbols-outlined' : ''}`}>
                  {habit.icon}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-xl tracking-tight">{habit.title}</h4>
                <div className="flex items-center gap-2 mt-1.5">
                   <p className="text-dim-gray text-[10px] font-bold uppercase tracking-widest opacity-40">
                     {getHabitSubtitle(habit)} • {habit.goal} Goal
                   </p>
                   <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: habit.color || '#000000' }} />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button 
                onClick={() => onEdit(habit.id)}
                className="p-3 text-dim-gray hover:text-pure-black hover:bg-white rounded-full transition-all"
                title="Edit"
              >
                <span className="material-symbols-outlined text-lg">edit</span>
              </button>
              <button 
                onClick={() => onDelete(habit.id)}
                className="p-3 text-dim-gray hover:text-red-500 hover:bg-white rounded-full transition-all"
                title="Delete"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          </div>
        ))}

        {habits.length === 0 && (
          <div className="py-20 text-center opacity-40">
            <p className="text-sm font-bold">No habits found.</p>
          </div>
        )}

        <div className="pb-10 pt-8 text-center">
           <p className="text-[10px] font-black text-dim-gray uppercase tracking-widest opacity-10">End of Inventory</p>
        </div>
      </div>
    </div>
  );
};
