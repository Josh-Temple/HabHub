
import React from 'react';

interface ActivityHeatmapProps {
  data: number[]; // Array of 0-4 intensity values
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data }) => {
  // Helpers for Tailwind classes based on intensity
  const getColorClass = (val: number) => {
    switch(val) {
      case 0: return 'bg-light-gray';
      case 1: return 'bg-gray-300';
      case 2: return 'bg-gray-400';
      case 3: return 'bg-gray-600';
      case 4: return 'bg-pure-black';
      default: return 'bg-light-gray';
    }
  };

  return (
    <div className="mt-8 bg-white p-6 rounded-2xl border border-light-gray shadow-sm">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-dim-gray mb-1">Activity Map</h3>
          <p className="text-xl font-bold tracking-tighter">Momentum</p>
        </div>
        <span className="text-dim-gray text-[10px] font-bold uppercase tracking-widest opacity-50">120D History</span>
      </div>
      
      <div className="grid grid-flow-col grid-rows-7 gap-1.5 overflow-x-auto no-scrollbar pb-2">
        {data.map((val, i) => (
          <div 
            key={i} 
            className={`w-3 h-3 rounded-sm transition-colors duration-500 ${getColorClass(val)}`} 
            title={`Intensity: ${val}/4`}
          />
        ))}
      </div>

      <div className="flex justify-between items-center mt-6 pt-4 border-t border-light-gray">
        <span className="text-[9px] uppercase tracking-widest font-black text-dim-gray">Dormant</span>
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2, 3, 4].map(v => (
            <div key={v} className={`w-2.5 h-2.5 rounded-sm ${getColorClass(v)}`} />
          ))}
        </div>
        <span className="text-[9px] uppercase tracking-widest font-black text-dim-gray">Peak</span>
      </div>
    </div>
  );
};
