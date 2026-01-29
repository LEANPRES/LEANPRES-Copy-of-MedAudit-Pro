
import React, { useState } from 'react';
import { User, UserRole, AppView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  user, 
  onLogout, 
  currentView,
  onViewChange
}) => {
  const isAdmin = user.role === UserRole.ADMIN_MASTER || user.role === UserRole.EMPRESA_GESTORA;
  const isOperator = user.role === UserRole.OPERADORA;
  
  const [isDashMenuOpen, setIsDashMenuOpen] = useState(
    currentView === 'DASHBOARD' || 
    currentView === 'DASHBOARD_OPERATIONAL' || 
    currentView === 'DASHBOARD_MANAGERIAL'
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 bg-brand-dark text-white flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-secondary rounded flex items-center justify-center font-black text-brand-dark">M</div>
          <span className="text-xl font-black tracking-tight">MedAudit Pro</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 no-scrollbar overflow-y-auto">
          {isAdmin ? (
            <div className="space-y-1">
              <button 
                onClick={() => setIsDashMenuOpen(!isDashMenuOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                  (currentView === 'DASHBOARD' || currentView === 'DASHBOARD_OPERATIONAL' || currentView === 'DASHBOARD_MANAGERIAL')
                    ? 'bg-brand-primary text-white shadow-lg' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>Dashboard / KPIs</span>
                <svg className={`w-3 h-3 transition-transform ${isDashMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isDashMenuOpen && (
                <div className="ml-4 space-y-1 pt-1 border-l border-white/10 pl-2 animate-in slide-in-from-top-2">
                  <NavItem 
                    label="Operacional" 
                    active={currentView === 'DASHBOARD_OPERATIONAL'} 
                    onClick={() => onViewChange('DASHBOARD_OPERATIONAL')}
                    subItem
                  />
                  <NavItem 
                    label="Gerencial" 
                    active={currentView === 'DASHBOARD_MANAGERIAL'} 
                    onClick={() => onViewChange('DASHBOARD_MANAGERIAL')}
                    subItem
                  />
                </div>
              )}
            </div>
          ) : (
            <NavItem 
              label="Dashboard / KPIs" 
              active={currentView === 'DASHBOARD'} 
              onClick={() => onViewChange('DASHBOARD')}
            />
          )}

          <NavItem 
            label="Pareceres / Fila" 
            active={currentView === 'LIST'} 
            onClick={() => onViewChange('LIST')} 
          />
          <NavItem 
            label="Novo Requerimento" 
            active={currentView === 'CREATE'} 
            onClick={() => onViewChange('CREATE')}
            disabled={!isOperator && !isAdmin} // Agora Admin também pode acessar para demos
          />
          {isAdmin && (
            <NavItem 
              label="Administração" 
              active={currentView === 'ADMIN'} 
              onClick={() => onViewChange('ADMIN')} 
            />
          )}
          
          <div className="pt-6 pb-2 text-[10px] font-black text-white/30 uppercase tracking-widest px-4">Recursos Especializados</div>
          <NavItem 
            label="Análise Médica (IA)" 
            active={currentView === 'MEDICAL_AUDIT'}
            onClick={() => onViewChange('MEDICAL_AUDIT')}
          />
          <NavItem 
            label="Dossiês e Prontuários" 
            active={currentView === 'RECORDS'}
            onClick={() => onViewChange('RECORDS')}
          />
        </nav>

        <div className="p-6 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center font-black text-white uppercase shadow-lg">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-[10px] font-black text-white truncate">{user.name}</div>
              <div className="text-[8px] font-black text-brand-secondary uppercase tracking-widest truncate">{(user.role || '').replace('_', ' ')}</div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full mt-4 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase p-3 rounded-lg border border-white/10 transition-all text-white/60 hover:text-brand-accent"
          >
            Encerrar Sessão
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-auto bg-slate-50">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Ambiente Seguro: <span className="text-brand-primary ml-1">Ativo</span>
            </h2>
            <span className="bg-support-beige text-brand-dark text-[9px] font-black px-3 py-1 rounded-full border border-slate-200 uppercase tracking-tight">
              AMBIENTE: {user.tenantCommercialName || user.tenantId || 'SISTEMA MASTER'}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="bg-slate-50 px-4 py-2 rounded-xl border flex items-center gap-3">
               <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></div>
               <span className="text-[10px] font-black text-brand-dark uppercase tracking-tight">Status do App: Online</span>
             </div>
          </div>
        </header>

        <main className="p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

const NavItem = ({ 
  label, 
  active = false, 
  onClick, 
  disabled = false,
  subItem = false
}: { 
  label: string; 
  active?: boolean; 
  onClick?: () => void;
  disabled?: boolean;
  subItem?: boolean;
}) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
      active 
        ? 'bg-brand-primary text-white shadow-xl shadow-black/20' 
        : disabled 
          ? 'text-white/20 cursor-not-allowed bg-white/5' 
          : 'text-white/60 hover:bg-white/5 hover:text-white'
    } ${subItem ? 'py-2 px-3 opacity-80' : ''}`}
  >
    {subItem && <span className="mr-2 opacity-50">•</span>}
    {label}
  </button>
);

export default Layout;
