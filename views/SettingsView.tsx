
import React from 'react';

export const SettingsView: React.FC = () => {
  const settings = [
    { section: 'System', items: ['Profile Settings', 'Appearance'] },
    { section: 'Preferences', items: ['Notifications', 'Data Management'] },
    { section: 'About', items: ['Privacy Policy', 'Sign Out'] }
  ];

  return (
    <div className="fade-in">
      <header className="mb-16">
        <p className="text-[10px] font-black text-dim-gray uppercase tracking-ultra-widest opacity-40 mb-3">Configuration</p>
        <h1 className="text-5xl font-black tracking-tighter">System</h1>
      </header>

      <div className="space-y-12">
        {settings.map((group, i) => (
          <section key={i}>
            <h3 className="text-[10px] font-black text-dim-gray uppercase tracking-ultra-widest mb-4 border-b border-border-gray pb-3 opacity-30">
              {group.section}
            </h3>
            <ul className="divide-y divide-border-gray">
              {group.items.map((item, j) => (
                <li 
                  key={j} 
                  className={`py-6 flex items-center justify-between cursor-pointer active:opacity-40 transition-opacity ${item === 'Sign Out' ? 'text-red-500' : 'text-pure-black'}`}
                >
                  <span className="text-xl font-bold tracking-tight">{item}</span>
                  <span className="material-symbols-outlined text-dim-gray text-lg opacity-30">chevron_right</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="mt-32 text-center opacity-10">
        <p className="text-[10px] font-black tracking-widest uppercase">Version 1.0.42</p>
        <p className="text-[9px] font-bold mt-2 italic">"Subtraction is the ultimate perfection."</p>
      </footer>
    </div>
  );
};
