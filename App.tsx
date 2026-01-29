
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, UserRole, AuditRequest, ChatMessage, AIDecisionSupport, Procedure, Tenant, AppView, AuditItem, WorkflowStep, TimelineEvent, FileMetadata, AIRule, WorkflowDocument, MedicalAuditor, AuditorType } from './types';
import { supabase } from './lib/supabase';
import { auditAIService } from './services/geminiService';
import { supabaseService } from './services/supabaseService';
import Layout from './components/Layout';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import AIDecisionPanel from './components/AIDecisionPanel';
import AdminDashboard from './components/AdminDashboard';
import WorkflowCommandCenterComponent from './components/WorkflowCommandCenter';
import AuditChat from './components/AuditChat';

export const calculateAge = (birthDate: string): string => {
  if (!birthDate) return '';
  try {
    const birth = new Date(birthDate + 'T00:00:00');
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();

    if (days < 0) {
      months--;
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    return `${years} anos`;
  } catch {
    return '';
  }
};

export const formatEnum = (val: any): string => {
  try {
    if (val === null || val === undefined) return '';
    
    const translations: Record<string, string> = {
      'ADMINISTRATIVE': 'TRIAGEM ADM',
      'AUDIT': 'AUDITORIA MÉDICA',
      'RELEASE': 'LIBERAÇÃO DE GUIA',
      'FINISHED': 'PROTOCOLO ENCERRADO',
      'PENDING_AUDIT': 'PEND. AUDITORIA',
      'RETURNED_TO_OPERATOR': 'DEVOLVIDO',
      'DRAFT': 'RASCUNHO',
      'COMPLETED': 'CONCLUÍDO',
      'CANCELED': 'CANCELADO',
      'PENDING': 'PENDENTE',
      'FAVORABLE': 'FAVORÁVEL',
      'UNFAVORABLE': 'DIVERGENTE',
      'PARTIAL': 'PARCIAL'
    };

    if (typeof val === 'string' && translations[val]) {
      return translations[val];
    }
    
    if (typeof val !== 'string' && typeof val !== 'number') return '';
    return String(val).split('_').join(' ');
  } catch (e) {
    return '';
  }
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [view, setView] = useState<AppView>('DASHBOARD');
  const [unauthView, setUnauthView] = useState<'LANDING' | 'LOGIN'>('LANDING');
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [activeListTab, setActiveListTab] = useState<'IN_PROGRESS' | 'COMPLETED'>('IN_PROGRESS');
  
  const [dbStatus, setDbStatus] = useState<'CONNECTING' | 'ONLINE' | 'ERROR'>('CONNECTING');
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [cids, setCids] = useState<{id?: number, code: string, description: string}[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [aiRules, setAiRules] = useState<AIRule[]>([]);
  const [auditors, setAuditors] = useState<MedicalAuditor[]>([]);
  const [requests, setRequests] = useState<AuditRequest[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  
  const [newReq, setNewReq] = useState({ 
    name: '', cardId: '', cid10: '', summary: '', birthDate: '', gender: 'NÃO DECLAROU',
    guiaNumber: '', requestDate: new Date().toISOString().split('T')[0],
    requestingUnimed: '', serviceType: 'EXAME AMBULATORIAL',
    requestCharacter: 1, accidentIndication: 9,
    serviceDate: new Date().toISOString().split('T')[0],
    coAuthorization: false, executingUnimed: '',
    executingUnimedCity: '', transactionNumber: ''
  });
  const [gridItems, setGridItems] = useState<AuditItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [listSearchTerm, setListSearchTerm] = useState(''); 
  const [searchResults, setSearchResults] = useState<Procedure[]>([]);
  
  const defaultDocs: WorkflowDocument[] = [
    { id: 'doc-1', name: 'LAUDO MÉDICO / RELATÓRIO', required: true, files: [] },
    { id: 'doc-2', name: 'EXAMES COMPLEMENTARES', required: true, files: [] },
    { id: 'doc-3', name: 'ORÇAMENTO DE MATERIAIS / OPME', required: true, files: [] },
    { id: 'doc-4', name: 'JUSTIFICATIVA TÉCNICA', required: true, files: [] },
    { id: 'doc-5', name: 'TERMO DE CONSENTIMENTO (TCLE)', required: true, files: [] },
  ];
  const [newReqDocs, setNewReqDocs] = useState<WorkflowDocument[]>(defaultDocs);

  const [aiDecision, setAiDecision] = useState<Record<string, AIDecisionSupport>>({});
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [messagesByRequest, setMessagesByRequest] = useState<Record<string, ChatMessage[]>>({});
  
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const [activeCreateDocId, setActiveCreateDocId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setIsInitializing(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setCurrentUser(null);
        setIsInitializing(false);
      }
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabaseService.getCurrentProfile(userId);
      if (error) throw new Error(error.message);
      
      if (data) {
        const t = data.tenant;
        const tenantInfo = Array.isArray(t) ? t[0] : t;
        const commercialName = tenantInfo?.commercial_name || tenantInfo?.name || data.tenant_id;

        setCurrentUser({ 
          id: data.id, 
          name: data.name, 
          role: data.role as UserRole, 
          tenantId: data.tenant_id,
          tenantCommercialName: commercialName,
          tipo_auditor: data.tipo_auditor as AuditorType || 'GENERALISTA',
          especialidade: data.specialty
        });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser({ 
          id: userId, 
          name: user?.user_metadata?.name || "Novo Usuário", 
          role: (user?.app_metadata?.role as UserRole) || UserRole.AUDITOR_MEDICO, 
          tenantId: user?.user_metadata?.tenant_id,
          tipo_auditor: 'GENERALISTA'
        });
      }
    } catch (err: any) {
      console.error("Falha no carregamento do perfil:", err.message);
    } finally {
      setIsInitializing(false);
    }
  };

  const loadData = async () => {
    if (!currentUser) return;
    setDbStatus('CONNECTING');
    try {
      const [rulesRes, reqsRes, tenantsRes, cidsRes, procsRes, docTemplatesRes, auditorsRes, profilesRes] = await Promise.all([
        supabaseService.getAIRules(),
        supabaseService.getRequests(currentUser.role, currentUser.tenantId),
        supabaseService.getTenants(),
        supabaseService.getCids(),
        supabaseService.getProcedures(),
        supabaseService.getDocumentTemplates(currentUser.tenantId),
        supabaseService.getAuditors(),
        supabaseService.getAllProfiles()
      ]);

      const mappedRequests = (reqsRes.data || []).map((r: any) => ({
        ...r,
        workflowStep: r.workflow_step || 'ADMINISTRATIVE',
        especialidade_alvo: r.especialidade_alvo,
        lastUpdate: r.last_update,
        createdAt: r.created_at,
        clinicalSummary: r.clinical_summary,
        items: (r.items || []).map((i: any) => ({
          ...i,
          quantityRequested: i.quantity_requested || 1,
          quantityAuthorized: i.quantity_authorized || 1,
          unitValue: i.unit_value || i.procedure?.fees_value || 0,
          status: i.status || 'PENDING',
          justification: i.justification || ''
        }))
      })) as AuditRequest[];

      setAiRules(rulesRes.data || []);
      setRequests(mappedRequests);
      setTenants(tenantsRes.data || []);
      setCids(cidsRes.data || []);
      setProcedures(procsRes.data || []);
      setAuditors(auditorsRes.data || []);
      setProfiles(profilesRes.data || []);

      if (docTemplatesRes.data && docTemplatesRes.data.length > 0) {
        setNewReqDocs(docTemplatesRes.data.map((t: any) => ({
          id: t.id, name: t.name, required: t.is_required, files: []
        })));
      } else {
        setNewReqDocs(defaultDocs);
      }

      setDbStatus('ONLINE');
    } catch (err: any) {
      console.error("Erro ao carregar dados operacionais:", err.message);
      setDbStatus('ERROR');
    }
  };

  useEffect(() => { if (currentUser) loadData(); }, [currentUser]);

  const mapMessage = (m: any): ChatMessage => ({
    id: m.id, requestId: m.request_id, senderId: m.sender_id, senderName: m.sender_name, senderRole: (m.sender_role as UserRole), content: m.content, timestamp: m.created_at, visibility: 'ALL'
  });

  useEffect(() => {
    if (!expandedId) return;
    supabaseService.getMessages(expandedId).then(res => {
      if (res.data) setMessagesByRequest(prev => ({ ...prev, [expandedId]: res.data!.map(mapMessage) }));
    });
    
    const channel = supabaseService.subscribeToMessages(expandedId, (newMsg: ChatMessage) => {
      setMessagesByRequest(prev => {
        const currentMsgs = prev[newMsg.requestId] || [];
        const isDuplicate = currentMsgs.some(m => m.id === newMsg.id || (m.id.startsWith('temp-') && m.content === newMsg.content && m.senderId === newMsg.senderId));
        if (isDuplicate) return { ...prev, [newMsg.requestId]: currentMsgs.map(m => (m.id.startsWith('temp-') && m.content === newMsg.content && m.senderId === newMsg.senderId) ? newMsg : m) };
        return { ...prev, [newMsg.requestId]: [...currentMsgs, newMsg] };
      });
    });
    
    return () => { channel.unsubscribe(); };
  }, [expandedId]);

  useEffect(() => {
    const search = async () => {
      if (searchTerm.length > 2) {
        const { data } = await supabaseService.searchProcedures(searchTerm);
        if (data) setSearchResults(data as Procedure[]);
      } else setSearchResults([]);
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSendMessage = async (requestId: string, content: string) => {
    if (!currentUser) return;
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = { id: tempId, requestId, senderId: currentUser.id, senderName: currentUser.name, senderRole: currentUser.role, content, timestamp: new Date().toISOString(), visibility: 'ALL' };
    setMessagesByRequest(prev => ({ ...prev, [requestId]: [...(prev[requestId] || []), optimisticMsg] }));
    try {
      await supabaseService.sendMessage({ requestId, senderId: currentUser.id, senderName: currentUser.name, senderRole: currentUser.role, content, visibility: 'ALL' });
    } catch (e: any) { 
      console.error("Erro ao enviar mensagem:", e.message);
      setMessagesByRequest(prev => ({ ...prev, [requestId]: (prev[requestId] || []).filter(m => m.id !== tempId) }));
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || gridItems.length === 0) {
      alert("Por favor, adicione pelo menos um procedimento à solicitação.");
      return;
    }
    
    setIsAiLoading(true);
    const request: Partial<AuditRequest> = {
      beneficiary: { id: `b-${Date.now()}`, name: newReq.name.toUpperCase(), cardId: newReq.cardId, birthDate: newReq.birthDate, gender: newReq.gender },
      cid10: newReq.cid10,
      status: 'PENDING_AUDIT',
      workflowStep: 'ADMINISTRATIVE',
      clinicalSummary: newReq.summary,
      items: gridItems,
      documents: newReqDocs,
      history: [{ id: `ev-${Date.now()}`, step: 'ADMINISTRATIVE', user: currentUser.name, role: currentUser.role, description: 'Protocolo registrado com sucesso através do painel da operadora.', timestamp: new Date().toISOString() }],
      // Novos campos administrativos TISS
      guiaNumber: newReq.guiaNumber,
      requestDate: newReq.requestDate,
      requestingUnimed: newReq.requestingUnimed,
      serviceType: newReq.serviceType,
      requestCharacter: newReq.requestCharacter,
      accidentIndication: newReq.accidentIndication,
      serviceDate: newReq.serviceDate,
      coAuthorization: newReq.coAuthorization,
      executingUnimed: newReq.executingUnimed,
      executingUnimedCity: newReq.executingUnimedCity,
      transactionNumber: newReq.transactionNumber
    };

    const targetTenant = currentUser.tenantId || tenants.find(t => t.type === 'OPERADORA')?.id;
    try {
      const { data, error } = await supabaseService.createRequest(request, targetTenant!);
      if (error) throw error;
      await loadData();
      setView('LIST');
      setGridItems([]);
      setNewReq({ 
        name: '', cardId: '', cid10: '', summary: '', birthDate: '', gender: 'NÃO DECLAROU',
        guiaNumber: '', requestDate: new Date().toISOString().split('T')[0],
        requestingUnimed: '', serviceType: 'EXAME AMBULATORIAL',
        requestCharacter: 1, accidentIndication: 9,
        serviceDate: new Date().toISOString().split('T')[0],
        coAuthorization: false, executingUnimed: '',
        executingUnimedCity: '', transactionNumber: ''
      });
      setNewReqDocs(defaultDocs);
      alert(`Protocolo ${data[0].id} registrado com sucesso.`);
    } catch (error: any) { alert("ERRO NO REGISTRO: " + (error.message || error)); } finally { setIsAiLoading(false); }
  };

  const handleUpdateItem = (reqId: string, itemId: string, updates: Partial<AuditItem>) => {
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, items: r.items.map(i => i.id === itemId ? { ...i, ...updates } : i) } : r));
  };

  const handleUpdateMetadata = (reqId: string, updates: Partial<AuditRequest>) => {
    setRequests(prev => prev.map(r => {
      if (r.id !== reqId) return r;
      let newBeneficiary = r.beneficiary;
      if (updates.beneficiary) newBeneficiary = { ...r.beneficiary, ...updates.beneficiary };
      return { ...r, ...updates, beneficiary: newBeneficiary };
    }));
  };

  const handleSaveMetadata = async (reqId: string) => {
    const req = requests.find(r => r.id === reqId);
    if (!req) return;
    setIsAiLoading(true);
    try {
      const { error } = await supabaseService.updateRequestStatus(reqId, req.workflowStep, req.status, req.history, req.items, req.documents, req);
      if (error) throw error;
      await loadData();
      setIsEditingMetadata(false);
    } catch (e: any) { alert("Erro ao salvar alterações: " + e.message); } finally { setIsAiLoading(false); }
  };

  const handleUpdateNewReqGridItem = (itemId: string, updates: Partial<AuditItem>) => {
    setGridItems(prev => prev.map(i => i.id === itemId ? { ...i, ...updates } : i));
  };

  const handleUpdateDocsRealTime = async (reqId: string, docId: string, nativeFiles: File[]) => {
    setIsUploading(true);
    try {
      const uploadResults = await Promise.all(nativeFiles.map((file: File) => supabaseService.uploadFile(file)));
      const newFiles: FileMetadata[] = uploadResults.filter(res => !res.error && res.data).map(res => res.data as FileMetadata);
      if (newFiles.length === 0) throw new Error("Falha no upload.");
      setRequests(prev => prev.map(r => {
        if (r.id !== reqId) return r;
        const updatedDocs = r.documents.map(doc => doc.id === docId ? { ...doc, files: [...(doc.files || []), ...newFiles] } : doc);
        supabaseService.updateRequestStatus(reqId, r.workflowStep, r.status, r.history, r.items, updatedDocs);
        return { ...r, documents: updatedDocs };
      }));
    } catch (error: any) { alert("Erro no Upload: " + error.message); } finally { setIsUploading(false); }
  };

  const handleTransition = async (reqId: string, nextStep: WorkflowStep, desc: string, metadataUpdates?: any) => {
    if (!currentUser) return;
    const req = requests.find(r => r.id === reqId);
    if (!req) return;
    const newHistory = [...(req.history || []), { id: `ev-${Date.now()}`, step: nextStep, user: currentUser.name, role: currentUser.role, description: desc, timestamp: new Date().toISOString() }];
    const { error } = await supabaseService.updateRequestStatus(reqId, nextStep, req.status, newHistory, req.items, req.documents, metadataUpdates);
    if (error) alert("Erro: " + error.message);
    else { await loadData(); setExpandedId(null); }
  };

  const handleCreateFileUpload = async (docId: string, nativeFiles: File[]) => {
    setIsUploading(true);
    try {
      const uploadResults = await Promise.all(nativeFiles.map(file => supabaseService.uploadFile(file)));
      const newFiles = uploadResults.filter(res => !res.error && res.data).map(res => res.data as FileMetadata);
      setNewReqDocs(prev => prev.map(doc => doc.id === docId ? { ...doc, files: [...(doc.files || []), ...newFiles] } : doc));
    } catch (e) { alert("Erro no upload."); } finally { setIsUploading(false); }
  };

  const currentQueue = useMemo(() => {
    if (!currentUser) return [];
    return requests.filter(r => {
      const step = r.workflowStep || 'ADMINISTRATIVE';
      const matchesTab = activeListTab === 'COMPLETED' ? step === 'FINISHED' : step !== 'FINISHED';
      let matchesRole = true;
      if (currentUser.role === UserRole.AUDITOR_MEDICO) {
        if (activeListTab === 'COMPLETED') matchesRole = true;
        else if (step === 'AUDIT') {
          if (currentUser.tipo_auditor === 'ESPECIALISTA') matchesRole = r.especialidade_alvo === currentUser.especialidade;
          else matchesRole = !r.especialidade_alvo || r.especialidade_alvo === 'GERAL';
        } else matchesRole = false;
      }
      const matchesSearch = listSearchTerm ? r.beneficiary.name.toLowerCase().includes(listSearchTerm.toLowerCase()) || r.id.toLowerCase().includes(listSearchTerm.toLowerCase()) : true;
      return matchesTab && matchesRole && matchesSearch;
    });
  }, [requests, activeListTab, currentUser, listSearchTerm]);

  const slaStats = useMemo(() => {
    let totalMs = 0; let count = 0;
    requests.forEach(req => {
      const history = req.history || [];
      const entryEvent = history.find(h => h.step === 'AUDIT');
      const exitEvents = history.filter(h => h.step === 'ADMINISTRATIVE' || h.step === 'RELEASE' || h.step === 'FINISHED');
      const lastExitEvent = exitEvents.length > 0 ? exitEvents[exitEvents.length - 1] : null;
      if (entryEvent && lastExitEvent) {
        const start = new Date(entryEvent.timestamp).getTime();
        const end = new Date(lastExitEvent.timestamp).getTime();
        if (end > start) { totalMs += (end - start); count++; }
      }
    });
    if (count === 0) return { label: '---', raw: 0 };
    const avgMs = totalMs / count;
    const hours = Math.floor(avgMs / (1000 * 60 * 60));
    const minutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
    return { label: hours >= 24 ? `${(hours / 24).toFixed(1)} Dias` : `${hours}h ${minutes}m`, raw: avgMs, count };
  }, [requests]);

  const selectedRequest = useMemo(() => requests.find(r => r.id === expandedId), [expandedId, requests]);

  if (isInitializing) return ( <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center"> <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div> <p className="text-white font-black text-[10px] uppercase tracking-widest mt-6">Autenticando e Aplicando Governança...</p> </div> );
  
  // Unauthenticated Flow: Landing Page or Login
  if (!session || !currentUser) {
    if (unauthView === 'LANDING') {
      return <LandingPage onLoginClick={() => setUnauthView('LOGIN')} />;
    }
    return (
      <div className="relative">
        <button 
          onClick={() => setUnauthView('LANDING')}
          className="fixed top-6 left-6 z-[250] bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
        >
          ← Voltar ao Início
        </button>
        <Login onLoginSuccess={(session) => setSession(session)} />
      </div>
    );
  }

  const isDashboardView = view === 'DASHBOARD' || view === 'DASHBOARD_OPERATIONAL' || view === 'DASHBOARD_MANAGERIAL';
  const isGestoraOrAdmin = currentUser.role === UserRole.EMPRESA_GESTORA || currentUser.role === UserRole.ADMIN_MASTER;
  const isAuditor = currentUser.role === UserRole.AUDITOR_MEDICO;

  return (
    <Layout user={currentUser} onLogout={() => supabaseService.logout()} currentView={view} onViewChange={setView}>
      {isDashboardView && (
        <div className="space-y-10 animate-in fade-in">
           <header className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
              <h1 className="text-3xl font-black text-brand-dark uppercase tracking-tighter"> {view === 'DASHBOARD_OPERATIONAL' ? 'Dashboard Operacional' : view === 'DASHBOARD_MANAGERIAL' ? 'Dashboard Gerencial' : 'MedAudit Pro Governance'} </h1>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Painel de Gestão e Monitoramento</p>
           </header>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard label="Triagem ADM" value={requests.filter(r => r.workflowStep === 'ADMINISTRATIVE').length} color="text-brand-primary" />
              <StatCard label="Auditoria Médica" value={requests.filter(r => r.workflowStep === 'AUDIT').length} color="text-brand-accent" />
              <StatCard label="Liberação de Guia" value={requests.filter(r => r.workflowStep === 'RELEASE').length} color="text-brand-secondary" />
              <StatCard label="Encerrados" value={requests.filter(r => r.workflowStep === 'FINISHED').length} color="text-brand-dark" />
           </div>
        </div>
      )}

      {view === 'LIST' && (
        <div className="space-y-6">
           <div className="flex bg-white py-4 px-8 rounded-3xl border shadow-sm items-center justify-between">
             <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button onClick={() => { setActiveListTab('IN_PROGRESS'); setExpandedId(null); }} className={`px-6 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${activeListTab === 'IN_PROGRESS' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-400'}`}>Em Andamento</button>
                <button onClick={() => { setActiveListTab('COMPLETED'); setExpandedId(null); }} className={`px-6 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${activeListTab === 'COMPLETED' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-400'}`}>Concluídas</button>
             </div>
             <input type="text" placeholder="BUSCAR POR NOME OU ID..." className="py-2 px-4 bg-slate-50 border rounded-xl w-72 font-bold text-xs uppercase" value={listSearchTerm} onChange={e => setListSearchTerm(e.target.value)} />
           </div>

           <div className="bg-white rounded-3xl border shadow-sm overflow-hidden min-h-[500px]">
             <table className="w-full text-left table-fixed">
                <thead className="bg-slate-50 border-b text-[9px] font-black uppercase text-slate-400">
                  <tr>
                    <th className="py-3 px-4 w-32">Protocolo</th>
                    <th className="py-3 px-4">Beneficiário / Guia TISS</th>
                    <th className="py-3 px-4 w-40">Etapa Atual</th>
                    <th className="py-3 px-4 w-32 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {currentQueue.map(req => (
                     <tr key={req.id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => { setExpandedId(req.id); setIsEditingMetadata(false); }}>
                        <td className="py-4 px-4 font-black text-brand-primary text-xs truncate">{req.id}</td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs uppercase text-slate-700 truncate">{req.beneficiary.name}</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">GUIA: {req.guiaNumber || '---'} | TISS</span>
                          </div>
                        </td>
                        <td className="py-4 px-4"> <span className="px-3 py-1 text-[8px] font-black rounded-lg bg-brand-primary/10 text-brand-primary uppercase border border-brand-primary/10"> {formatEnum(req.workflowStep)} </span> </td>
                        <td className="py-4 px-4 text-right font-black text-[9px] text-brand-primary uppercase tracking-tighter"> DETALHAR 🔍 </td>
                     </tr>
                   ))}
                </tbody>
             </table>
           </div>

           {expandedId && selectedRequest && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
                <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-sm" onClick={() => setExpandedId(null)}></div>
                <div className="relative bg-slate-50 w-full max-w-[95%] max-h-[95vh] rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                  <div className="bg-white px-10 py-8 border-b flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                      <div className="w-1.5 h-10 bg-brand-primary rounded-full"></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tighter">Protocolo: {selectedRequest.id}</h3>
                          <span className="px-4 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase border border-brand-primary/20"> {formatEnum(selectedRequest.workflowStep)} </span>
                          {!isEditingMetadata ? ( <button onClick={() => setIsEditingMetadata(true)} className="p-2 bg-slate-100 hover:bg-brand-primary/10 rounded-xl transition-all group"> <svg className="w-5 h-5 text-slate-400 group-hover:text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> </button> ) : ( <button onClick={() => handleSaveMetadata(selectedRequest.id)} className="px-4 py-2 bg-brand-primary text-white text-[9px] font-black uppercase rounded-xl hover:bg-brand-dark transition-all shadow-lg flex items-center gap-2"> <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> Salvar Protocolo </button> )}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setExpandedId(null)} className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all group"> <svg className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg> </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                    <div className="space-y-10 max-w-full mx-auto pb-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-4">
                              <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-widest border-b pb-2">Identificação do Beneficiário</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                 <div className="md:col-span-2"><label className="text-[8px] font-black text-slate-400 uppercase">Nome</label>
                                 {isEditingMetadata ? <input className="w-full text-[10px] font-black p-2 bg-slate-50 border rounded-lg" value={selectedRequest.beneficiary.name} onChange={e => handleUpdateMetadata(selectedRequest.id, { beneficiary: { ...selectedRequest.beneficiary, name: e.target.value.toUpperCase() } })} /> : <p className="text-[11px] font-black text-brand-dark truncate">{selectedRequest.beneficiary.name}</p>}</div>
                                 <div><label className="text-[8px] font-black text-slate-400 uppercase">Carteira</label>
                                 {isEditingMetadata ? <input className="w-full text-[10px] font-black p-2 bg-slate-50 border rounded-lg" value={selectedRequest.beneficiary.cardId} onChange={e => handleUpdateMetadata(selectedRequest.id, { beneficiary: { ...selectedRequest.beneficiary, cardId: e.target.value } })} /> : <p className="text-[11px] font-black text-brand-dark">{selectedRequest.beneficiary.cardId}</p>}</div>
                                 <div><label className="text-[8px] font-black text-slate-400 uppercase">Sexo</label>
                                 {isEditingMetadata ? <select className="w-full text-[10px] font-black p-2 bg-slate-50 border rounded-lg" value={selectedRequest.beneficiary.gender} onChange={e => handleUpdateMetadata(selectedRequest.id, { beneficiary: { ...selectedRequest.beneficiary, gender: e.target.value } })}>
                                   <option value="MASCULINO">MASCULINO</option>
                                   <option value="FEMININO">FEMININO</option>
                                   <option value="NÃO DECLAROU">NÃO DECLAROU</option>
                                 </select> : <p className="text-[11px] font-black text-brand-dark">{selectedRequest.beneficiary.gender || '---'}</p>}</div>
                                 <div className="md:col-span-2"><label className="text-[8px] font-black text-slate-400 uppercase">Nascimento</label>
                                 {isEditingMetadata ? <input type="date" className="w-full text-[10px] font-black p-2 bg-slate-50 border rounded-lg" value={selectedRequest.beneficiary.birthDate} onChange={e => handleUpdateMetadata(selectedRequest.id, { beneficiary: { ...selectedRequest.beneficiary, birthDate: e.target.value } })} /> : <p className="text-[11px] font-black text-brand-dark">{new Date(selectedRequest.beneficiary.birthDate + 'T00:00:00').toLocaleDateString()}</p>}</div>
                                 <div className="md:col-span-2"><label className="text-[8px] font-black text-slate-400 uppercase">Idade Auditada</label>
                                 <p className="text-[11px] font-black text-brand-primary">{calculateAge(selectedRequest.beneficiary.birthDate)}</p></div>
                              </div>
                           </div>

                           <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm space-y-4">
                              <h4 className="text-[10px] font-black text-brand-accent uppercase tracking-widest border-b pb-2">Dados Administrativos TISS</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                 <div><label className="text-[8px] font-black text-slate-400 uppercase">Nº Guia</label>
                                 {isEditingMetadata ? <input className="w-full text-[10px] font-black p-2 bg-slate-50 border rounded-lg" value={selectedRequest.guiaNumber || ''} onChange={e => handleUpdateMetadata(selectedRequest.id, { guiaNumber: e.target.value })} /> : <p className="text-[11px] font-black text-brand-dark">{selectedRequest.guiaNumber || '---'}</p>}</div>
                                 <div><label className="text-[8px] font-black text-slate-400 uppercase">Transação</label>
                                 {isEditingMetadata ? <input className="w-full text-[10px] font-black p-2 bg-slate-50 border rounded-lg" value={selectedRequest.transactionNumber || ''} onChange={e => handleUpdateMetadata(selectedRequest.id, { transactionNumber: e.target.value })} /> : <p className="text-[11px] font-black text-brand-dark">{selectedRequest.transactionNumber || '---'}</p>}</div>
                                 <div><label className="text-[8px] font-black text-slate-400 uppercase">Data Pedido</label>
                                 {isEditingMetadata ? <input type="date" className="w-full text-[10px] font-black p-2 bg-slate-50 border rounded-lg" value={selectedRequest.requestDate || ''} onChange={e => handleUpdateMetadata(selectedRequest.id, { requestDate: e.target.value })} /> : <p className="text-[11px] font-black text-brand-dark">{selectedRequest.requestDate ? new Date(selectedRequest.requestDate).toLocaleDateString() : '---'}</p>}</div>
                                 <div><label className="text-[8px] font-black text-slate-400 uppercase">Caráter</label>
                                 {isEditingMetadata ? <select className="w-full text-[10px] font-black p-2 bg-slate-50 border rounded-lg" value={selectedRequest.requestCharacter} onChange={e => handleUpdateMetadata(selectedRequest.id, { requestCharacter: Number(e.target.value) })}>
                                   <option value={1}>ELETIVA</option>
                                   <option value={2}>URGÊNCIA</option>
                                 </select> : <p className={`text-[11px] font-black ${selectedRequest.requestCharacter === 2 ? 'text-brand-accent' : 'text-brand-primary'}`}>{selectedRequest.requestCharacter === 2 ? '⚠️ URGÊNCIA' : '🟢 ELETIVA'}</p>}</div>
                              </div>
                           </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] shadow-xl border overflow-hidden">
                          <div className="bg-slate-50 p-8 border-b">
                             <h3 className="text-xl font-black text-brand-dark uppercase tracking-tight">Análise Pericial de Itens</h3>
                          </div>
                          <table className="w-full text-left">
                            <thead className="text-[9px] font-black uppercase text-slate-500 bg-slate-50">
                              <tr> <th className="py-4 px-8">Código TUSS</th> <th className="py-4 px-8">Procedimento</th> <th className="py-4 px-8 text-center">Sol.</th> <th className="py-4 px-8 text-center">Aut.</th> <th className="py-4 px-8 text-center">Status</th> </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {selectedRequest.items.map(item => (
                                <tr key={item.id}>
                                  <td className="py-4 px-8 font-black text-xs">{item.procedure.code}</td>
                                  <td className="py-4 px-8 font-bold text-[11px] uppercase truncate max-w-xs">{item.procedure.description}</td>
                                  <td className="py-4 px-8 text-center font-black">{item.quantityRequested}</td>
                                  <td className="py-4 px-8 text-center">
                                    {isAuditor && activeListTab !== 'COMPLETED' ? <input type="number" className="w-16 p-2 border rounded-xl text-center font-black" value={item.quantityAuthorized} onChange={e => handleUpdateItem(selectedRequest.id, item.id, { quantityAuthorized: Number(e.target.value) })} /> : <span className="font-black text-brand-primary">{item.quantityAuthorized}</span>}
                                  </td>
                                  <td className="py-4 px-8 text-center">
                                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg border ${item.status === 'FAVORABLE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{formatEnum(item.status)}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                          <div className="lg:col-span-1 min-h-[500px]"> <AIDecisionPanel decision={aiDecision[selectedRequest.id]} isLoading={isAiLoading} hasRules={aiRules.length > 0} onAnalyze={() => { setIsAiLoading(true); auditAIService.analyzeRequest(selectedRequest, aiRules).then(res => { setAiDecision(prev => ({...prev, [selectedRequest.id]: res})); setIsAiLoading(false); }); }} /> </div>
                          <div className="lg:col-span-1 min-h-[500px]"> <WorkflowCommandCenterComponent request={selectedRequest} user={currentUser} onTransition={(step, desc, metadata) => handleTransition(selectedRequest.id, step, desc, metadata)} onUpdateFiles={(docId, files) => handleUpdateDocsRealTime(selectedRequest.id, docId, files)} onGenerateCode={() => handleTransition(selectedRequest.id, 'FINISHED', 'Autorização gerada pelo auditor médico.')} /> </div>
                          <div className="lg:col-span-1 min-h-[500px]"> <AuditChat protocolId={selectedRequest.id} currentUser={currentUser} messages={messagesByRequest[selectedRequest.id] || []} onSendMessage={(content) => handleSendMessage(selectedRequest.id, content)} /> </div>
                        </div>
                    </div>
                  </div>
                </div>
              </div>
           )}
        </div>
      )}

      {view === 'CREATE' && (
        <div className="max-w-7xl mx-auto space-y-8 animate-in slide-in-from-bottom-8">
           <input type="file" multiple ref={createFileInputRef} className="hidden" onChange={(e) => { if (e.target.files && activeCreateDocId) { handleCreateFileUpload(activeCreateDocId, Array.from(e.target.files)); setActiveCreateDocId(null); } }} />
           <header className="bg-white p-10 rounded-[3rem] shadow-sm border"> <h2 className="text-4xl font-black text-brand-dark uppercase tracking-tighter">Protocolo de Novo Requerimento</h2> </header>
           <form onSubmit={handleCreateRequest} className="space-y-8 pb-20">
              <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border space-y-8">
                <div className="flex items-center gap-3 border-b pb-6"><div className="w-10 h-10 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary font-black">01</div><h3 className="text-xl font-black text-brand-dark uppercase tracking-tight">Identificação do Paciente</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Nome Completo</label><input type="text" className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-2xl font-bold uppercase focus:border-brand-primary outline-none" value={newReq.name} onChange={e => setNewReq({...newReq, name: e.target.value.toUpperCase()})} required /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Nº Carteira / ID</label><input type="text" className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-brand-primary outline-none" value={newReq.cardId} onChange={e => setNewReq({...newReq, cardId: e.target.value})} required /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Data de Nascimento</label><input type="date" className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-brand-primary outline-none" value={newReq.birthDate} onChange={e => setNewReq({...newReq, birthDate: e.target.value})} required /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Sexo Biológico</label><select className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-brand-primary outline-none" value={newReq.gender} onChange={e => setNewReq({...newReq, gender: e.target.value.toUpperCase()})}><option value="MASCULINO">MASCULINO</option><option value="FEMININO">FEMININO</option><option value="NÃO DECLAROU">NÃO DECLAROU</option></select></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">CID-10 Principal</label><select className="w-full p-6 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-brand-primary outline-none" value={newReq.cid10} onChange={e => setNewReq({...newReq, cid10: e.target.value})} required><option value="">SELECIONE...</option>{cids.map(c => <option key={c.code} value={c.code}>{c.code} - {c.description}</option>)}</select></div>
                </div>
              </div>

              <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center gap-3 border-b pb-6"><div className="w-10 h-10 bg-brand-accent/10 rounded-2xl flex items-center justify-center text-brand-accent font-black">02</div><h3 className="text-xl font-black text-brand-dark uppercase tracking-tight">Dados Administrativos da Guia (TISS)</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Número da Guia</label><input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-brand-primary outline-none" value={newReq.guiaNumber} onChange={e => setNewReq({...newReq, guiaNumber: e.target.value})} /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Data da Solicitação</label><input type="date" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-brand-primary outline-none" value={newReq.requestDate} onChange={e => setNewReq({...newReq, requestDate: e.target.value})} required /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Unimed Solicitante</label><input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold uppercase focus:border-brand-primary outline-none" value={newReq.requestingUnimed} onChange={e => setNewReq({...newReq, requestingUnimed: e.target.value.toUpperCase()})} /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Tipo de Atendimento</label><select className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-brand-primary outline-none" value={newReq.serviceType} onChange={e => setNewReq({...newReq, serviceType: e.target.value})}><option value="EXAME AMBULATORIAL">EXAME AMBULATORIAL</option><option value="INTERNACAO">INTERNAÇÃO</option><option value="URGENCIA">URGÊNCIA</option><option value="HOME CARE">HOME CARE</option></select></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Caráter Solicitação</label><select className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-brand-primary outline-none" value={newReq.requestCharacter} onChange={e => setNewReq({...newReq, requestCharacter: Number(e.target.value)})}><option value={1}>1 - ELETIVA</option><option value={2}>2 - URGÊNCIA/EMERGÊNCIA</option></select></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Indicação Acidente</label><select className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-brand-primary outline-none" value={newReq.accidentIndication} onChange={e => setNewReq({...newReq, accidentIndication: Number(e.target.value)})}><option value={9}>9 - NÃO ACIDENTE</option><option value={1}>1 - TRABALHO</option><option value={2}>2 - TRÂNSITO</option><option value={3}>3 - OUTROS</option></select></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Data Entrada Sistema</label><input type="date" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-brand-primary outline-none" value={newReq.serviceDate} onChange={e => setNewReq({...newReq, serviceDate: e.target.value})} required /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Autorização em CO</label><select className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-brand-primary outline-none" value={newReq.coAuthorization ? 'S' : 'N'} onChange={e => setNewReq({...newReq, coAuthorization: e.target.value === 'S'})}><option value="N">NÃO</option><option value="S">SIM</option></select></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Unimed Executora</label><input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold uppercase focus:border-brand-primary outline-none" value={newReq.executingUnimed} onChange={e => setNewReq({...newReq, executingUnimed: e.target.value.toUpperCase()})} /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Cidade Executora</label><input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold uppercase focus:border-brand-primary outline-none" value={newReq.executingUnimedCity} onChange={e => setNewReq({...newReq, executingUnimedCity: e.target.value.toUpperCase()})} /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Nº Transação</label><input type="text" className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-brand-primary outline-none" value={newReq.transactionNumber} onChange={e => setNewReq({...newReq, transactionNumber: e.target.value})} /></div>
                </div>
              </div>

              <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border space-y-8">
                <div className="flex items-center gap-3 border-b pb-6"><div className="w-10 h-10 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary font-black">03</div><h3 className="text-xl font-black text-brand-dark uppercase tracking-tight">Grade de Procedimentos TUSS</h3></div>
                <div className="relative space-y-4">
                  <input type="text" placeholder="PESQUISE PROCEDIMENTO..." className="w-full p-6 bg-slate-50 border-2 border-brand-primary/20 rounded-2xl font-black uppercase shadow-inner outline-none focus:border-brand-primary" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  {searchResults.length > 0 && (<div className="absolute top-full left-0 right-0 bg-white border-2 rounded-2xl shadow-2xl z-[100] mt-2 max-h-72 overflow-auto">{searchResults.map(p => (<button key={p.id} type="button" onClick={() => { setGridItems([...gridItems, { id: `i-${Date.now()}`, procedure: p, quantityRequested: 1, quantityAuthorized: 1, unitValue: p.fees_value, status: 'PENDING' }]); setSearchTerm(''); setSearchResults([]); }} className="w-full p-5 text-left hover:bg-slate-50 border-b flex justify-between items-center group transition-colors"><div><span className="font-black text-brand-primary text-xs block">{p.code}</span><span className="font-bold text-[10px] uppercase text-slate-500">{p.description}</span></div></button>))}</div>)}
                  <div className="bg-slate-50/50 rounded-3xl border overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 border-b text-[10px] font-black uppercase text-slate-400"><tr><th className="p-6">TUSS</th><th className="p-6">Descrição</th><th className="p-6 text-center w-32">Qtd Sol.</th><th className="p-6 text-right w-44">Total</th><th className="p-6 text-center w-20">Ação</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">{gridItems.map(item => (<tr key={item.id} className="bg-white"><td className="p-6 font-black text-xs text-brand-primary">{item.procedure.code}</td><td className="p-6 text-[10px] font-bold uppercase">{item.procedure.description}</td><td className="p-6 text-center"><input type="number" className="w-full p-3 bg-slate-50 border rounded-xl text-center font-black" value={item.quantityRequested} onChange={e => handleUpdateNewReqGridItem(item.id, { quantityRequested: Number(e.target.value) })} /></td><td className="p-6 text-right font-black">R$ {(item.quantityRequested * item.unitValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td><td className="p-6 text-center"><button type="button" onClick={() => setGridItems(gridItems.filter(i => i.id !== item.id))} className="text-brand-accent">X</button></td></tr>))}</tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border space-y-8">
                <div className="flex items-center gap-3 border-b pb-6"><div className="w-10 h-10 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary font-black">04</div><h3 className="text-xl font-black text-brand-dark uppercase tracking-tight">Dossiê Documental Obrigatório</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {newReqDocs.map(doc => ( <div key={doc.id} className="p-6 rounded-[2rem] border-2 bg-slate-50 flex flex-col justify-between gap-4"> <div><h4 className="text-[10px] font-black uppercase text-brand-dark">{doc.name}</h4></div> <button type="button" onClick={() => { setActiveCreateDocId(doc.id); createFileInputRef.current?.click(); }} className="w-full py-3 rounded-xl text-[9px] font-black uppercase bg-white border text-brand-primary"> {doc.files.length > 0 ? `${doc.files.length} Arquivos` : 'Anexar Documento'} </button> </div> ))} </div>
              </div>

              <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border space-y-8">
                <div className="flex items-center gap-3 border-b pb-6"><div className="w-10 h-10 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary font-black">05</div><h3 className="text-xl font-black text-brand-dark uppercase tracking-tight">Fundamentação Técnica</h3></div>
                <div className="space-y-2"><textarea className="w-full p-10 bg-slate-50 border-2 border-transparent rounded-[3rem] font-bold outline-none leading-relaxed" rows={5} value={newReq.summary} onChange={e => setNewReq({...newReq, summary: e.target.value})} required /></div>
                <button type="submit" disabled={isAiLoading || gridItems.length === 0} className="w-full bg-brand-primary text-white p-10 rounded-[3rem] font-black uppercase shadow-2xl hover:bg-brand-dark transition-all disabled:opacity-50"> {isAiLoading ? 'Processando...' : 'Protocolar Pedido de Auditoria'} </button>
              </div>
           </form>
        </div>
      )}
      {view === 'ADMIN' && currentUser && <AdminDashboard profiles={profiles} procedures={procedures} cids={cids} tenants={tenants} auditors={auditors} userRole={currentUser.role} aiRules={aiRules} onUpdateAiRules={setAiRules} onDataChange={loadData} />}
    </Layout>
  );
};

const StatCard = ({ label, value, color }: { label: string, value: string | number, color: string }) => (
  <div className="bg-white p-10 rounded-[3rem] border shadow-sm group hover:border-brand-primary transition-all duration-500"><div className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest group-hover:text-brand-primary">{label}</div><div className={`text-4xl font-black ${color}`}>{value}</div></div>
);

export default App;
