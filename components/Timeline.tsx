
import React from 'react';
import { TimelineEvent } from '../types';

interface TimelineProps {
  events: TimelineEvent[];
}

const Timeline: React.FC<TimelineProps> = ({ events }) => {
  return (
    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-md">
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Rastreamento do Pedido (Time-Log)</h3>
      <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
        {(events || []).map((event, idx) => (
          <div key={event.id} className="relative pl-10 animate-in fade-in duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
              idx === 0 ? 'bg-blue-600 scale-125' : 'bg-slate-200'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-white' : 'bg-slate-400'}`}></div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] font-black uppercase text-slate-900">{event.user}</span>
                <span className="text-[8px] font-black uppercase text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{(event.role || '').replace('_', ' ')}</span>
                <span className="text-[9px] font-bold text-slate-400 ml-auto">{new Date(event.timestamp).toLocaleString()}</span>
              </div>
              <p className="text-xs text-slate-600 font-bold leading-tight">{event.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
