
import React, { useRef, useState } from 'react';
import { AuditRequest, UserRole, WorkflowStep, FileMetadata, User } from '../types';
import { formatEnum } from '../App';

interface WorkflowCommandCenterProps {
  request: AuditRequest;
  user: User;
  onTransition: (nextStep: WorkflowStep, description: string, metadataUpdates?: any) => void;
  onUpdateFiles: (docId: string, files: File[]) => void;
  onGenerateCode: () => void;
}

const WorkflowCommandCenter: React.FC<WorkflowCommandCenterProps> = ({ 
  request, 
  user, 
  onTransition, 
  onUpdateFiles,
  onGenerateCode
}) => {
  const isOperator = user.role === UserRole.OPERADORA;
  const isAuditor = user.role === UserRole.AUDITOR_MEDICO;
  const isGestor = user.role === UserRole.EMPRESA_GESTORA || user.role === UserRole.ADMIN_MASTER;
  const currentStep = request.workflowStep || 'ADMINISTRATIVE';
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [showSpecialtySelector, setShowSpecialtySelector] = useState(false);
  
  const MEDVISOR_URL = 'https://medvisor.unimedcbs.com.br/ords/r/sojm/medvisor-landingpage/hub';

  const specialties = [
    'ORTOPEDIA', 'COLUNA', 'NEUROCIRURGIA', 'GENETICA', 'ENDOVASCULAR', 'CARDIOLOGIA', 'ONCOLOGIA'
  ];

  const stepConfig = {
    ADMINISTRATIVE: { color: 'bg-brand-primary', label: 'TRIAGEM ADM' },
    AUDIT: { color: 'bg-brand-accent', label: 'FILA TÉCNICA MÉDICA' },
    RELEASE: { color: 'bg-brand-secondary', label: 'LIBERAÇÃO DE GUIA' },
    FINISHED: { color: 'bg-brand-dark', label: 'PROTOCOLO ENCERRADO' }
  };

  const config = stepConfig[currentStep] || stepConfig.ADMINISTRATIVE;

  const handleForwardToSpecialty = (specialty: string) => {
    onTransition('AUDIT', `Protocolo encaminhado para fila especializada: ${specialty}`, { especialidade_alvo: specialty });
    setShowSpecialtySelector(false);
  };

  const handleReturnToGeneral = () => {
    onTransition('AUDIT', `Especialista devolveu o processo para a Fila Geral de Triagem.`, { especialidade_alvo: 'GERAL' });
  };

  return (
    <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl bg-white flex flex-col h-full relative">
      <input type="file" multiple ref={fileInputRef} onChange={async (e) => {
        if (e.target.files && activeDocId) {
          await onUpdateFiles(activeDocId, Array.from(e.target.files));
          setActiveDocId(null);
        }
      }} className="hidden" />

      {showSpecialtySelector && (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm p-8 flex flex-col animate-in fade-in zoom-in-95">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-xs uppercase tracking-widest text-brand-dark">Selecionar Especialidade</h3>
            <button onClick={() => setShowSpecialtySelector(false)} className="text-slate-400 hover:text-rose-500">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2 overflow-y-auto no-scrollbar">
            {specialties.map(spec => (
              <button 
                key={spec} 
                onClick={() => handleForwardToSpecialty(spec)}
                className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-xl text-left font-black text-[10px] uppercase text-brand-dark hover:border-brand-primary hover:bg-white transition-all"
              >
                🧬 {spec}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={`${config.color} p-6 flex items-center justify-between text-white`}>
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-black uppercase tracking-tighter leading-none">{config.label}</h2>
        </div>
        <div className="bg-white/20 px-4 py-1.5 rounded-full font-black text-[9px] uppercase border border-white/10 whitespace-nowrap">
          {formatEnum(request.status)}
        </div>
      </div>

      <div className="p-8 space-y-8 flex-1">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dossiê Documental</h3>
          <div className="space-y-2">
            {(request.documents || []).map(doc => {
              const hasFiles = doc.files && doc.files.length > 0;
              return (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border">
                  <span className={`font-black text-[10px] uppercase ${hasFiles ? 'text-brand-primary' : 'text-slate-400'}`}>{doc.name}</span>
                  {hasFiles ? (
                    <div className="flex gap-2">
                       {doc.files.map((f, i) => (
                         <button key={i} onClick={() => f.url && window.open(f.url, '_blank')} className="text-[8px] font-black text-brand-primary uppercase underline">Ver 📎</button>
                       ))}
                    </div>
                  ) : (
                    (isOperator || isAuditor) && <button onClick={() => { setActiveDocId(doc.id); fileInputRef.current?.click(); }} className="text-[8px] font-black text-brand-primary uppercase">Anexar</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 pt-6 border-t border-slate-100">
          {currentStep === 'ADMINISTRATIVE' && isOperator && (
            <button onClick={() => onTransition('AUDIT', 'Enviado para Auditoria.')} className="w-full bg-brand-primary text-white p-5 rounded-2xl font-black text-[10px] uppercase shadow-lg mb-2">Encaminhar Auditoria</button>
          )}

          {currentStep === 'AUDIT' && isAuditor && (
            <div className="space-y-2">
              <button onClick={() => onTransition('RELEASE', 'Parecer técnico finalizado.')} className="w-full bg-brand-accent text-white p-5 rounded-2xl font-black text-[10px] uppercase shadow-lg mb-2">Concluir Análise Médica</button>
              
              {/* Lógica de Roteamento de Especialidade */}
              {user.tipo_auditor === 'GENERALISTA' ? (
                <button 
                  onClick={() => setShowSpecialtySelector(true)}
                  className="w-full bg-brand-primary/10 text-brand-primary border-2 border-brand-primary/20 p-4 rounded-xl font-black text-[9px] uppercase hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                  Encaminhar p/ Especialista
                </button>
              ) : (
                <button 
                  onClick={handleReturnToGeneral}
                  className="w-full bg-amber-50 text-amber-600 border-2 border-amber-200 p-4 rounded-xl font-black text-[9px] uppercase hover:bg-amber-600 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                  Devolver p/ Fila Geral
                </button>
              )}
            </div>
          )}

          {currentStep === 'RELEASE' && isOperator && (
            <button onClick={onGenerateCode} className="w-full bg-brand-dark text-white p-5 rounded-2xl font-black text-[10px] uppercase shadow-lg mb-2">Efetivar Guia (TISS)</button>
          )}

          {currentStep !== 'FINISHED' && (
            <div className="grid grid-cols-1 gap-2 pt-2">
              {(currentStep === 'AUDIT' || currentStep === 'RELEASE') && (isAuditor || isGestor) && (
                <button 
                  onClick={() => onTransition('ADMINISTRATIVE', 'Devolvido para fila operadora por inconsistência.')} 
                  className="w-full bg-white border-2 border-slate-200 text-slate-400 p-3.5 rounded-xl font-black text-[9px] uppercase hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all"
                >
                  Recusar / Devolver p/ Operadora
                </button>
              )}
              
              {(isAuditor || isGestor || isOperator) && (
                <>
                  <button 
                    onClick={() => {
                      if (isAuditor) {
                        onTransition('ADMINISTRATIVE', 'o médico auditor sugere enviar para a Segunda Opinião');
                      } else {
                        window.open(MEDVISOR_URL, '_blank');
                      }
                    }} 
                    className="w-full bg-white border-2 border-brand-primary/20 text-brand-primary p-3.5 rounded-xl font-black text-[9px] uppercase hover:bg-brand-primary hover:text-white transition-all"
                  >
                    Segunda Opinião Técnica
                  </button>
                  <button 
                    onClick={() => {
                      if (isAuditor) {
                        onTransition('ADMINISTRATIVE', 'O Médico Auditor sugere enviar para Junta Médica');
                      } else {
                        window.open(MEDVISOR_URL, '_blank');
                      }
                    }} 
                    className="w-full bg-brand-dark text-white p-3.5 rounded-xl font-black text-[9px] uppercase hover:bg-brand-primary transition-all shadow-md"
                  >
                    Convocar Junta Médica
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowCommandCenter;
