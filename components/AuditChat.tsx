
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChatMessage, User, UserRole } from '../types';

interface AuditChatProps {
  messages: ChatMessage[];
  currentUser: User;
  onSendMessage: (content: string) => void;
  onClose?: () => void;
  protocolId: string;
}

const AuditChat: React.FC<AuditChatProps> = ({ messages, currentUser, onSendMessage, onClose, protocolId }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mapeamento de cores baseado na paleta de Cores de Apoio
  // Melhoria: Removida qualquer transparência (/60, /80) para garantir que as letras não fiquem apagadas
  const roleColors: Record<UserRole, { bg: string, text: string, label: string }> = {
    [UserRole.ADMIN_MASTER]: { 
      bg: 'bg-support-blue', 
      text: 'text-brand-dark', 
      label: 'text-brand-dark' 
    },
    [UserRole.EMPRESA_GESTORA]: { 
      bg: 'bg-support-green', 
      text: 'text-brand-dark', 
      label: 'text-brand-dark' 
    },
    [UserRole.OPERADORA]: { 
      bg: 'bg-support-yellow', 
      text: 'text-brand-dark', 
      label: 'text-brand-dark' 
    },
    [UserRole.AUDITOR_MEDICO]: { 
      bg: 'bg-support-rose', 
      text: 'text-white', 
      label: 'text-white' 
    },
  };

  // Fix it: Rolagem automática para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInput('');
  };

  const safeFormatTime = (ts: any) => {
    if (!ts) return '--:--';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return '--:--'; }
  };

  if (!protocolId) return null;

  return (
    <div className="flex flex-col h-[600px] w-full border-0 rounded-[2.5rem] bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
      <div className="bg-brand-dark text-white p-6 flex justify-between items-center border-b border-white/10">
        <div>
          <h3 className="font-black text-xs uppercase tracking-widest text-brand-secondary">Discussão Técnica</h3>
          <span className="text-[10px] font-bold text-white uppercase">Protocolo: {protocolId}</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 no-scrollbar scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-30">
            <p className="text-brand-dark font-black text-[10px] uppercase tracking-widest">Inicie a colaboração técnica.</p>
          </div>
        ) : messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          const isTemp = msg.id.startsWith('temp-');
          const roleConfig = roleColors[msg.senderRole] || { bg: 'bg-white', text: 'text-slate-900', label: 'text-slate-900' };
          
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isTemp ? 'opacity-90' : 'opacity-100'}`}>
              <div className={`max-w-[85%] p-4 rounded-3xl text-sm shadow-md border-0 ${
                roleConfig.bg} ${roleConfig.text} ${isMe ? 'rounded-br-none' : 'rounded-bl-none'} 
                transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`font-black text-[9px] uppercase tracking-tight ${roleConfig.label}`}>
                    {msg.senderName} • {(msg.senderRole || '').replace('_', ' ')}
                  </span>
                  <span className={`text-[8px] font-black ${roleConfig.label}`}>
                    {isTemp ? 'Enviando...' : safeFormatTime(msg.timestamp)}
                  </span>
                </div>
                <div className="font-bold leading-relaxed whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-6 border-t bg-white">
        <div className="flex gap-3">
          <input
            type="text"
            className="flex-1 bg-slate-100 border-2 border-transparent rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:bg-white focus:border-brand-primary outline-none transition-all"
            placeholder="Digite sua mensagem técnica..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} disabled={!input.trim()} className="bg-brand-primary text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl hover:bg-brand-dark transition-all disabled:opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditChat;
