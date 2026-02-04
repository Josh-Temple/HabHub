
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AppData, Habit, Entry } from './types';
import { loadData, saveData, getDateKey, isHabitDue } from './utils/dataUtils';
import { TodayView } from './views/TodayView';
import { AnalysisView } from './views/AnalysisView';
import { SettingsView } from './views/SettingsView';
import { HabitsListView } from './views/HabitsListView';
import { CreateHabitView } from './views/CreateHabitView';

type ViewTab = 'today' | 'create' | 'analysis' | 'habits' | 'settings';

const App: React.FC = () => {
  // Load V2 data (handles migration internally)
  const [data, setData] = useState<AppData>(loadData);
  const [activeTab, setActiveTab] = useState<ViewTab>('today');
  const [lastActiveTab, setLastActiveTab] = useState<ViewTab>('today');
  
  // Track which habit is being edited (null = creating new)
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

  // Persistence: Save whenever data changes
  useEffect(() => {
    saveData(data);
  }, [data]);

  // Compute daily stats for the Header
  const stats = useMemo(() => {
    const todayKey = getDateKey();
    
    // Filter to only include habits that are actually DUE today.
    const dueHabits = data.habits.filter(h => isHabitDue(h, todayKey));
    
    const completed = dueHabits.filter(h => {
      const entry = data.entries.find(e => e.habitId === h.id && e.dateKey === todayKey);
      return entry && entry.count >= h.goal;
    }).length;
    
    return { completed, total: dueHabits.length };
  }, [data]);

  // Find the habit object if we are in edit mode
  const habitToEdit = useMemo(() => 
    editingHabitId ? data.habits.find(h => h.id === editingHabitId) : undefined
  , [data.habits, editingHabitId]);

  // Handle incrementing count (Log)
  const handleLog = useCallback((id: string) => {
    const todayKey = getDateKey();
    setData(prev => {
      const existingEntry = prev.entries.find(e => e.habitId === id && e.dateKey === todayKey);
      let newEntries;
      
      if (existingEntry) {
        newEntries = prev.entries.map(e => 
          (e.habitId === id && e.dateKey === todayKey) 
            ? { ...e, count: e.count + 1, updatedAt: new Date().toISOString() }
            : e
        );
      } else {
        const newEntry: Entry = {
          habitId: id,
          dateKey: todayKey,
          count: 1,
          updatedAt: new Date().toISOString()
        };
        newEntries = [...prev.entries, newEntry];
      }
      return { ...prev, entries: newEntries };
    });
  }, []);

  // Handle toggling complete/incomplete
  const handleToggleComplete = useCallback((id: string) => {
    const todayKey = getDateKey();
    setData(prev => {
      const habit = prev.habits.find(h => h.id === id);
      if (!habit) return prev;

      const existingEntry = prev.entries.find(e => e.habitId === id && e.dateKey === todayKey);
      const isComplete = existingEntry && existingEntry.count >= habit.goal;
      
      let newEntries;
      if (existingEntry) {
        newEntries = prev.entries.map(e => 
          (e.habitId === id && e.dateKey === todayKey) 
            ? { ...e, count: isComplete ? 0 : habit.goal, updatedAt: new Date().toISOString() }
            : e
        );
      } else {
        newEntries = [...prev.entries, {
          habitId: id,
          dateKey: todayKey,
          count: habit.goal,
          updatedAt: new Date().toISOString()
        }];
      }
      return { ...prev, entries: newEntries };
    });
  }, []);

  // Handle Save (Create or Update)
  const handleSaveHabit = useCallback((habit: Habit) => {
    setData(prev => {
      if (editingHabitId) {
        // Update existing
        return {
          ...prev,
          habits: prev.habits.map(h => h.id === editingHabitId ? { ...habit, id: editingHabitId, createdAt: h.createdAt } : h)
        };
      } else {
        // Create new
        return {
          ...prev,
          habits: [...prev.habits, habit]
        };
      }
    });
    setEditingHabitId(null);
    setActiveTab('today');
  }, [editingHabitId]);

  const handleDeleteHabit = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to remove this habit?')) {
      setData(prev => ({
        ...prev,
        habits: prev.habits.filter(h => h.id !== id),
        entries: prev.entries.filter(e => e.habitId !== id) // Cleanup entries too
      }));
    }
  }, []);

  const handleEditHabit = useCallback((id: string) => {
    setEditingHabitId(id);
    setActiveTab('create');
  }, []);

  const toggleSettings = useCallback(() => {
    if (activeTab === 'settings') {
      setActiveTab(lastActiveTab);
    } else {
      setLastActiveTab(activeTab);
      setActiveTab('settings');
    }
  }, [activeTab, lastActiveTab]);

  const handleTabChange = useCallback((tab: ViewTab) => {
    // If leaving create tab manually, cancel edit mode
    if (tab !== 'create') {
      setEditingHabitId(null);
    }
    setActiveTab(tab);
    if (tab !== 'settings') {
      setLastActiveTab(tab);
    }
  }, []);

  const viewContent = useMemo(() => {
    switch (activeTab) {
      case 'create': return (
        <CreateHabitView 
          onSave={handleSaveHabit} 
          initialData={habitToEdit} 
          onCancel={() => {
            setEditingHabitId(null);
            setActiveTab('today');
          }}
        />
      );
      case 'analysis': return <AnalysisView data={data} />;
      case 'habits': return (
        <HabitsListView 
          habits={data.habits} 
          onDelete={handleDeleteHabit} 
          onEdit={handleEditHabit} 
        />
      );
      case 'settings': return <SettingsView />;
      default: return (
        <TodayView 
          habits={data.habits}
          entries={data.entries}
          completedCount={stats.completed} 
          onLog={handleLog}
          onToggleComplete={handleToggleComplete}
        />
      );
    }
  }, [activeTab, data, stats, handleLog, handleToggleComplete, handleSaveHabit, handleDeleteHabit, handleEditHabit, habitToEdit]);

  return (
    <div className="min-h-screen bg-white text-pure-black">
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl z-[60] flex items-center justify-between px-10 max-w-2xl mx-auto pointer-events-none">
        <div className="text-[10px] font-black tracking-ultra-widest opacity-20 uppercase pointer-events-auto cursor-default">
          HabHub
        </div>
        <button 
          onClick={toggleSettings}
          className={`material-symbols-outlined text-xl transition-all duration-500 pointer-events-auto ${activeTab === 'settings' ? 'opacity-100 scale-110' : 'opacity-20 hover:opacity-100'}`}
        >
          settings
        </button>
      </header>

      <main className="max-w-xl mx-auto px-10 pt-32 pb-48 overflow-visible">
        <div className="fade-in key-experience">
          {viewContent}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-[100] flex justify-center pb-10 px-8 pointer-events-none">
        <nav className="w-full max-w-[320px] bg-white/80 backdrop-blur-2xl border border-border-gray rounded-full p-1.5 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.08)] pointer-events-auto">
          {[
            { id: 'today', icon: 'home' },
            { id: 'create', icon: 'add' },
            { id: 'analysis', icon: 'analytics' },
            { id: 'habits', icon: 'list' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => handleTabChange(tab.id as ViewTab)}
              className={`flex-1 flex flex-col items-center justify-center py-3.5 transition-all duration-500 relative ${activeTab === tab.id ? 'text-pure-black scale-105' : 'text-dim-gray opacity-30 hover:opacity-80'}`}
            >
              {activeTab === tab.id && (
                <div className="absolute inset-x-2 inset-y-1 bg-light-gray rounded-full -z-10" />
              )}
              <span className={`material-symbols-outlined font-light text-2xl transition-all ${activeTab === tab.id ? 'font-bold' : ''}`}>
                {tab.icon}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default App;
