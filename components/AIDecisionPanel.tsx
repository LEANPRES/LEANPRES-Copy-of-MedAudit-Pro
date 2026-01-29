
import React from 'react';
import { AIDecisionSupport } from '../types';

interface AIDecisionPanelProps {
  decision?: AIDecisionSupport;
  isLoading: boolean;
  onAnalyze: () => void;
  hasRules?: boolean;
}

const AIDecisionPanel: React.FC<AIDecisionPanelProps> = ({ decision, isLoading, onAnalyze, hasRules }) => {
  if (isLoading) {
    return (
      <div className="bg-brand-dark/5 border-2 border-dashed border-brand-primary/30 rounded-[3rem] p-10 flex flex-col items-center justify-center animate-pulse min-h-[350px]">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h4 className="text-brand-dark font-black text-[10px] uppercase tracking-widest text-center">IA Processando Evidências...</h4>
      </div>
    );
  }

  if (!decision) {
    return (
      <div className="bg-gradient-to-br from-brand-dark to-brand-primary border-4 border-white shadow-xl rounded-[2.5rem] p-8 text-center relative overflow-hidden">
        <div className="relative z-10">
          <div className="bg-brand-secondary text-brand-dark inline-block px-4 py-1 rounded-full text-[8px] font-black uppercase mb-4 shadow-lg">
            Motor Gemini 3.0 Pro Ativo
          </div>
          <h3 className="text-white font-black text-lg uppercase tracking-tighter mb-2">Apoio à Decisão Cognitiva</h3>
          <p className="text-white/70 text-[10px] font-bold mb-6 uppercase px-4">
            Clique para analisar CID-10, Itens e Dossiê contra as Regras de Governança.
          </p>
          <button 
            onClick={onAnalyze} 
            className="w-full bg-white text-brand-dark py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-secondary transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.3 1.047a1 1 0 01.897.953V5h2.224a1 1 0 01.953 1.302l-4.44 11.475a1 1 0 01-1.834-.055L6.077 8.163A1 1 0 017.03 6.837H9V2a1 1 0 011.3-.953z" clipRule="evenodd" />
            </svg>
            Disparar Auditoria Cognitiva
          </button>
        </div>
      </div>
    );
  }

  const statusColors = {
    APPROVE: 'bg-brand-primary text-white',
    REJECT: 'bg-brand-accent text-white',
    PARTIAL: 'bg-brand-dark text-white'
  };

  return (
    <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-xl overflow-hidden animate-in slide-in-from-right-4 duration-500">
      <div className="bg-slate-50 px-8 py-5 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white font-black text-[10px]">AI</div>
          <h3 className="font-black text-[10px] text-brand-dark uppercase tracking-widest">Parecer de IA</h3>
        </div>
        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase ${statusColors[decision.recommendation]}`}>
          {decision.recommendation === 'APPROVE' ? 'Favorável' : decision.recommendation === 'REJECT' ? 'Desfavorável' : 'Divergente'}
        </span>
      </div>
      
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-[9px] font-black text-slate-400 mb-2 uppercase">Confiança Clínica</div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div className="h-full bg-brand-primary transition-all duration-1000" style={{ width: `${decision.confidence * 100}%` }}></div>
            </div>
          </div>
          <div className="text-2xl font-black text-brand-dark font-mono">{(decision.confidence * 100).toFixed(0)}%</div>
        </div>
        
        <div className="p-6 bg-support-beige/20 rounded-2xl border-l-4 border-brand-primary">
          <p className="font-bold text-brand-dark text-[11px] leading-relaxed italic">
            "{decision.reasoning}"
          </p>
        </div>

        {decision.regulatoryReferences.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-4 border-t">
             {decision.regulatoryReferences.slice(0, 3).map((ref, i) => (
               <span key={i} className="bg-slate-50 text-slate-500 text-[8px] font-black px-3 py-1.5 rounded-lg uppercase border">📎 {ref}</span>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDecisionPanel;
