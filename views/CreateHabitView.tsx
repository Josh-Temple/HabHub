
import React, { useState, useEffect } from 'react';
import { Habit, HabitFrequency } from '../types';
import { getDateKey } from '../utils/dataUtils';

interface CreateHabitViewProps {
  onSave: (habit: Habit) => void;
  onDelete?: (id: string) => void;
  onCancel?: () => void;
  initialData?: Habit;
}

const COLORS = [
  { name: 'Ink', hex: '#000000' },
  { name: 'Smoke', hex: '#8E8E93' },
  { name: 'Crimson', hex: '#FF3B30' },
  { name: 'Tangerine', hex: '#FF9500' },
  { name: 'Canary', hex: '#FFCC00' },
  { name: 'Forest', hex: '#34C759' },
  { name: 'Ocean', hex: '#007AFF' },
  { name: 'Violet', hex: '#AF52DE' }
];

// Expanded Material Symbols library
const ICONS = [
  // Essentials
  'check_circle', 'star', 'favorite', 'bolt', 'schedule',
  // Health & Fitness
  'fitness_center', 'directions_run', 'pedal_bike', 'pool', 'water_drop',
  'restaurant', 'local_cafe', 'no_food', 'medication', 'monitor_heart',
  // Mindfulness & Sleep
  'self_improvement', 'spa', 'bedtime', 'sunny', 'nature',
  // Productivity & Work
  'work', 'computer', 'mail', 'call', 'calendar_today',
  'savings', 'attach_money', 'trending_up', 'done_all', 'priority_high',
  // Learning & Creation
  'book', 'school', 'edit', 'brush', 'palette',
  'music_note', 'mic', 'camera_alt', 'headphones', 'piano',
  // Home & Lifestyle
  'home', 'shopping_cart', 'cleaning_services', 'pets', 'child_care',
  'flight', 'commute', 'directions_car', 'local_shipping', 'build',
  // Social & Leisure
  'groups', 'celebration', 'wine_bar', 'sports_esports', 'movie',
  'videogame_asset', 'stadium', 'hiking', 'kayaking', 'emoji_events'
];

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type SchedulingMode = 'specific' | 'flexible';

export const CreateHabitView: React.FC<CreateHabitViewProps> = ({ onSave, onDelete, onCancel, initialData }) => {
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('1');
  const [selectedColor, setSelectedColor] = useState(COLORS[0].hex);
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [schedulingMode, setSchedulingMode] = useState<SchedulingMode>('specific');
  const [intervalTarget, setIntervalTarget] = useState('3'); // For flexible mode
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([]);
  const [selectedMonthDays, setSelectedMonthDays] = useState<number[]>([]);
  const [targetDate, setTargetDate] = useState(getDateKey()); // Default to today
  const [externalUrl, setExternalUrl] = useState('');
  const [icon, setIcon] = useState('stat_0');
  const [customIcon, setCustomIcon] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialize with existing data if editing
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setGoal(initialData.goal.toString());
      setSelectedColor(initialData.color);
      setFrequency(initialData.frequency);
      setSelectedWeekDays(initialData.weekDays || []);
      setSelectedMonthDays(initialData.monthDays || []);
      setTargetDate(initialData.targetDate || getDateKey());
      setExternalUrl(initialData.externalUrl || '');
      
      if (initialData.targetIntervalCount) {
        setSchedulingMode('flexible');
        setIntervalTarget(initialData.targetIntervalCount.toString());
      } else {
        setSchedulingMode('specific');
      }
      
      // Determine if icon is standard or custom
      if (ICONS.includes(initialData.icon)) {
        setIcon(initialData.icon);
        setCustomIcon('');
      } else {
        setIcon('');
        setCustomIcon(initialData.icon);
      }
    }
  }, [initialData]);

  // Reset logic when frequency changes
  useEffect(() => {
    if (frequency === 'daily' || frequency === 'once') {
        setSchedulingMode('specific');
    }
  }, [frequency]);

  const toggleWeekDay = (index: number) => {
    setSelectedWeekDays(prev => 
      prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index]
    );
  };

  const toggleMonthDay = (day: number) => {
    setSelectedMonthDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleCustomIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomIcon(e.target.value);
    if (e.target.value) setIcon(''); // Clear selection if typing custom
  };

  const handleIconSelect = (i: string) => {
    setIcon(i);
    setCustomIcon(''); // Clear custom if selecting preset
  };

  const handleTestLink = () => {
    if (!externalUrl) return;
    const url = externalUrl.trim();
    const isWeb = url.toLowerCase().startsWith('http://') || url.toLowerCase().startsWith('https://');
    
    if (isWeb) {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      setError("Please enter a habit name.");
      return;
    }

    const goalNum = parseInt(goal);
    if (isNaN(goalNum) || goalNum < 1 || goalNum > 9999) {
      setError("Target must be between 1 and 9999.");
      return;
    }
    
    let intervalCount: number | undefined = undefined;

    if (frequency === 'weekly' || frequency === 'monthly') {
        if (schedulingMode === 'specific') {
            if (frequency === 'weekly' && selectedWeekDays.length === 0) {
                setError("Please select at least one day of the week.");
                return;
            }
            if (frequency === 'monthly' && selectedMonthDays.length === 0) {
                setError("Please select at least one day of the month.");
                return;
            }
        } else {
            // Flexible
            const t = parseInt(intervalTarget);
            if (isNaN(t) || t < 1) {
                setError("Please set a valid target count.");
                return;
            }
            intervalCount = t;
        }
    }
    
    if (frequency === 'once' && !targetDate) {
       setError("Please select a date for the task.");
       return;
    }

    const finalIcon = customIcon.trim() || icon || 'stat_0';

    setError(null);

    const newHabit: Habit = {
      id: initialData ? initialData.id : Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      goal: goalNum,
      icon: finalIcon,
      color: selectedColor,
      frequency,
      weekDays: (frequency === 'weekly' && schedulingMode === 'specific') ? selectedWeekDays : undefined,
      monthDays: (frequency === 'monthly' && schedulingMode === 'specific') ? selectedMonthDays : undefined,
      targetIntervalCount: intervalCount,
      targetDate: frequency === 'once' ? targetDate : undefined,
      externalUrl: externalUrl.trim() || undefined,
      createdAt: initialData ? initialData.createdAt : new Date().toISOString(),
      archived: false
    };
    
    onSave(newHabit);
  };

  return (
    <div className="flex flex-col">
      <header className="mb-12">
        <p className="text-[10px] font-black text-dim-gray uppercase tracking-ultra-widest opacity-40 mb-3">
          {initialData ? 'Configuration' : 'Goal Specification'}
        </p>
        <h1 className="text-5xl font-black tracking-tighter leading-none">
          {initialData ? 'Edit Item' : 'New Item'}
        </h1>
      </header>

      <div className="space-y-12">
        {/* Objective Input */}
        <div className="group">
          <label className="text-[10px] font-black uppercase tracking-ultra-widest text-dim-gray block mb-4 transition-colors opacity-40 group-focus-within:opacity-100 group-focus-within:text-pure-black">Item Name</label>
          <div className="relative">
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter name..." 
              className="w-full bg-light-gray/30 border-none rounded-2xl focus:ring-0 focus:bg-light-gray/60 transition-all duration-500 px-6 py-6 text-2xl font-bold tracking-tight text-pure-black placeholder:text-border-gray placeholder:font-medium"
            />
          </div>
        </div>

        {/* Frequency Selection */}
        <div className="group">
          <label className="text-[10px] font-black uppercase tracking-ultra-widest text-dim-gray block mb-4 opacity-40">Frequency</label>
          <div className="flex bg-light-gray/30 p-1 rounded-2xl mb-6">
            {(['daily', 'weekly', 'monthly', 'once'] as HabitFrequency[]).map((f) => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${frequency === f ? 'bg-white text-pure-black shadow-sm' : 'text-dim-gray hover:text-pure-black'}`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Mode Switcher for Weekly/Monthly */}
          {(frequency === 'weekly' || frequency === 'monthly') && (
             <div className="flex gap-6 mb-6 px-1">
                 <button 
                   onClick={() => setSchedulingMode('specific')}
                   className={`flex items-center gap-2 text-xs font-bold transition-all ${schedulingMode === 'specific' ? 'text-pure-black opacity-100' : 'text-dim-gray opacity-40 hover:opacity-100'}`}
                 >
                    <span className={`w-3 h-3 rounded-full border-[3px] ${schedulingMode === 'specific' ? 'border-pure-black' : 'border-dim-gray'}`} />
                    Specific Days
                 </button>
                 <button 
                   onClick={() => setSchedulingMode('flexible')}
                   className={`flex items-center gap-2 text-xs font-bold transition-all ${schedulingMode === 'flexible' ? 'text-pure-black opacity-100' : 'text-dim-gray opacity-40 hover:opacity-100'}`}
                 >
                    <span className={`w-3 h-3 rounded-full border-[3px] ${schedulingMode === 'flexible' ? 'border-pure-black' : 'border-dim-gray'}`} />
                    Flexible Count
                 </button>
             </div>
          )}

          {/* Weekly - Specific */}
          {frequency === 'weekly' && schedulingMode === 'specific' && (
            <div className="flex justify-between gap-1 mb-6 animate-[fadeIn_0.3s_ease-out]">
              {WEEKDAYS.map((day, i) => (
                <button
                  key={i}
                  onClick={() => toggleWeekDay(i)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${selectedWeekDays.includes(i) ? 'bg-pure-black text-white scale-110 shadow-lg' : 'bg-light-gray/30 text-dim-gray hover:bg-light-gray'}`}
                >
                  {day}
                </button>
              ))}
            </div>
          )}

          {/* Monthly - Specific */}
          {frequency === 'monthly' && schedulingMode === 'specific' && (
            <div className="flex flex-col gap-2 mb-6 animate-[fadeIn_0.3s_ease-out]">
               <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <button
                    key={day}
                    onClick={() => toggleMonthDay(day)}
                    className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-black transition-all duration-200 ${selectedMonthDays.includes(day) ? 'bg-pure-black text-white scale-110' : 'bg-light-gray/30 text-dim-gray hover:bg-light-gray'}`}
                    >
                    {day}
                    </button>
                ))}
               </div>
               <button
                  onClick={() => toggleMonthDay(32)}
                  className={`w-full py-3 mt-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 ${selectedMonthDays.includes(32) ? 'bg-pure-black text-white' : 'bg-light-gray/30 text-dim-gray hover:bg-light-gray'}`}
               >
                  End of Month
               </button>
            </div>
          )}

          {/* Flexible Count Input */}
          {schedulingMode === 'flexible' && (
             <div className="animate-[fadeIn_0.3s_ease-out] mb-6">
                <div className="relative flex items-center bg-light-gray/30 rounded-2xl">
                    <input 
                        type="number" 
                        value={intervalTarget}
                        onChange={(e) => setIntervalTarget(e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-0 px-6 py-6 text-2xl font-bold tracking-tight text-pure-black tabular-nums"
                    />
                    <span className="absolute right-6 text-[10px] font-black uppercase text-dim-gray tracking-[0.2em] opacity-40 pointer-events-none">
                        Times / {frequency === 'weekly' ? 'Week' : 'Month'}
                    </span>
                </div>
                <p className="mt-3 text-[10px] text-dim-gray font-medium leading-relaxed opacity-60 px-2">
                    This task will appear on your list every day until you reach your goal for the {frequency}.
                </p>
             </div>
          )}
          
          {/* Once / Date Picker */}
          {frequency === 'once' && (
             <div className="mb-6 animate-[fadeIn_0.3s_ease-out]">
                <input 
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-light-gray/30 border-none rounded-2xl focus:ring-0 px-6 py-4 text-xl font-bold tracking-tight text-pure-black"
                />
             </div>
          )}
        </div>

        {/* Iconography */}
        <div className="group">
          <label className="text-[10px] font-black uppercase tracking-ultra-widest text-dim-gray block mb-4 opacity-40">Iconography</label>
          <div className="bg-light-gray/30 p-4 rounded-3xl">
             <div className="grid grid-cols-5 gap-3 mb-4 max-h-60 overflow-y-auto pr-1">
                {ICONS.map((i) => (
                  <button
                    key={i}
                    onClick={() => handleIconSelect(i)}
                    className={`aspect-square rounded-2xl flex items-center justify-center transition-all ${icon === i ? 'bg-pure-black text-white shadow-lg sticky top-0 z-10' : 'bg-white text-dim-gray hover:text-pure-black hover:bg-white/80'}`}
                  >
                    <span className="material-symbols-outlined">{i}</span>
                  </button>
                ))}
             </div>
             <div className="relative">
               <input
                 type="text"
                 value={customIcon}
                 onChange={handleCustomIconChange}
                 placeholder="Or type an Emoji..."
                 className="w-full bg-white border-none rounded-xl focus:ring-0 px-4 py-3 text-sm font-bold text-center placeholder:font-normal placeholder:text-dim-gray/50"
               />
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Timeframe Input */}
          <div className="group">
            <label className="text-[10px] font-black uppercase tracking-ultra-widest text-dim-gray block mb-4 transition-colors opacity-40 group-focus-within:opacity-100 group-focus-within:text-pure-black">Daily Goal</label>
            <div className="relative flex items-center">
              <input 
                type="number" 
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-light-gray/30 border-none rounded-2xl focus:ring-0 focus:bg-light-gray/60 transition-all duration-500 px-6 py-6 text-2xl font-bold tracking-tight text-pure-black tabular-nums"
              />
              <span className="absolute right-6 text-[10px] font-black uppercase text-dim-gray tracking-[0.2em] opacity-20 pointer-events-none">
                Times/Day
              </span>
            </div>
          </div>

          {/* Color Selection */}
          <div className="flex flex-col">
            <label className="text-[10px] font-black uppercase tracking-ultra-widest text-dim-gray block mb-4 opacity-40">Color Accent</label>
            <div className="grid grid-cols-4 gap-4 w-fit py-2">
              {COLORS.map(c => (
                <button
                  key={c.hex}
                  onClick={() => setSelectedColor(c.hex)}
                  className={`w-6 h-6 rounded-full transition-all duration-500 relative flex items-center justify-center ${selectedColor === c.hex ? 'scale-110 ring-1 ring-offset-4 ring-pure-black' : 'opacity-20 hover:opacity-100'}`}
                  style={{ backgroundColor: c.hex }}
                  aria-label={c.name}
                >
                  {selectedColor === c.hex && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* External URL */}
        <div className="group">
          <label className="text-[10px] font-black uppercase tracking-ultra-widest text-dim-gray block mb-4 transition-colors opacity-40 group-focus-within:opacity-100 group-focus-within:text-pure-black">External Integration</label>
          <div className="relative flex items-center">
            {/* Added pr-24 to prevent text from going under the button */}
            <input 
              type="text" 
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://... or anki://..." 
              className="w-full bg-light-gray/30 border-none rounded-2xl focus:ring-0 focus:bg-light-gray/60 transition-all duration-500 pl-6 py-6 pr-24 text-xl font-medium tracking-tight text-pure-black placeholder:text-border-gray placeholder:font-medium"
            />
            {externalUrl && (
              <button
                onClick={handleTestLink}
                className="absolute right-3 bg-white text-pure-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-border-gray shadow-sm hover:bg-light-gray transition-all"
              >
                Test
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-xs font-bold mt-2 animate-pulse">{error}</p>
        )}

        <div className="flex gap-4 mt-8">
           {initialData && onCancel && (
             <button
               onClick={onCancel}
               className="flex-1 py-7 bg-light-gray text-dim-gray rounded-[2rem] font-black uppercase tracking-[0.6em] text-[10px] hover:bg-gray-200 transition-all"
             >
               Cancel
             </button>
           )}
           <button 
            onClick={handleSubmit}
            className="flex-[2] py-7 bg-pure-black text-white rounded-[2rem] font-black uppercase tracking-[0.6em] text-[10px] hover:bg-near-black active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(0,0,0,0.1)]"
          >
            {initialData ? 'Save Changes' : 'Confirm'}
          </button>
        </div>

        {/* Delete Button (Only in Edit Mode) */}
        {initialData && onDelete && (
            <div className="mt-12 pt-8 border-t border-border-gray flex justify-center">
                <button 
                    onClick={() => onDelete(initialData.id)}
                    className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:text-red-600 hover:bg-red-50 px-6 py-3 rounded-xl transition-all opacity-60 hover:opacity-100"
                >
                    Delete Habit
                </button>
            </div>
        )}
      </div>
    </div>
  );
};
