
import React, { useMemo } from 'react';
import { AppData } from '../types';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
import { calculateStats } from '../utils/dataUtils';

interface AnalysisViewProps {
  data: AppData;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ data }) => {
  const stats = useMemo(() => calculateStats(data.habits, data.entries), [data]);

  return (
    <div className="fade-in">
      <header className="mb-16">
        <p className="text-[10px] font-extrabold text-dim-gray uppercase tracking-ultra-widest opacity-40 mb-3">Deep Insights</p>
        <h1 className="text-5xl font-black tracking-tighter">Analysis</h1>
      </header>

      <section className="mb-16">
        <div className="grid grid-cols-2 gap-10 border-b border-light-gray pb-12">
          <div>
            <h2 className="text-5xl font-black tracking-tighter">{stats.consistency}%</h2>
            <p className="text-dim-gray text-[10px] font-bold uppercase tracking-widest mt-3 opacity-40">Consistency (30d)</p>
          </div>
          <div className="text-right">
            <h2 className="text-5xl font-black tracking-tighter">{stats.streak}</h2>
            <p className="text-dim-gray text-[10px] font-bold uppercase tracking-widest mt-3 opacity-40">Day Streak</p>
          </div>
        </div>
      </section>

      {/* Activity Heatmap */}
      <section className="mb-20">
        <ActivityHeatmap data={stats.heatmapData} />
      </section>

      <section className="mb-20">
        <h3 className="text-[10px] font-bold text-dim-gray uppercase tracking-[0.2em] mb-12 text-center opacity-40">Last 7 Days</h3>
        <div className="flex items-end justify-between h-40 px-2">
          {stats.last7Days.map((stat, i) => (
            <div key={i} className="flex flex-col items-center flex-1 group">
              <div 
                className="w-2 bg-near-black rounded-full transition-all duration-700 ease-out origin-bottom group-hover:scale-x-150"
                style={{ height: `${Math.max(stat.val, 5)}%` }} // Min height for visibility
              />
              <span className="text-[10px] font-black text-dim-gray/40 mt-5 group-hover:text-pure-black transition-colors">{stat.day}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-px bg-light-gray rounded-2xl overflow-hidden border border-light-gray mb-12">
        {[
          { label: 'Active Habits', val: data.habits.filter(h => !h.archived).length },
          { label: 'Total Entries', val: data.entries.length },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 hover:bg-off-white transition-colors">
            <p className="text-[9px] font-extrabold text-dim-gray uppercase tracking-[0.2em] mb-2 opacity-40">{stat.label}</p>
            <p className="text-2xl font-black tracking-tighter">{stat.val}</p>
          </div>
        ))}
      </section>
    </div>
  );
};
