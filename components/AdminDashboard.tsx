
import React, { useState } from 'react';
import { UserRole, Procedure, Tenant, MedicalAuditor, AIRule } from '../types';
import { supabaseService } from '../services/supabaseService';

interface AdminDashboardProps {
  profiles: any[];
  procedures: Procedure[];
  cids: { id?: number; code: string; description: string }[];
  tenants: Tenant[];
  auditors: MedicalAuditor[];
  userRole: UserRole;
  aiRules: AIRule[];
  onUpdateAiRules: (rules: AIRule[]) => void;
  onDataChange: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  profiles,
  procedures, 
  cids, 
  tenants, 
  auditors,
  userRole,
  aiRules,
  onDataChange
}) => {
  const [activeTab, setActiveTab] = useState<string>(userRole === UserRole.ADMIN_MASTER ? 'GESTORAS' : 'OPERADORAS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const tabs = [
    { id: 'GESTORAS', label: 'Gestoras' },
    { id: 'OPERADORAS', label: 'Operadoras' },
    { id: 'AUDITORES', label: 'Auditores' },
    { id: 'PERFIS', label: 'Perfis (Usuários)' },
    { id: 'PROCEDIMENTO', label: 'Procedimentos' },
    { id: 'SADT', label: 'SADT' },
    { id: 'INSUMO', label: 'Insumos' },
    { id: 'FARMACO', label: 'Fármacos' },
    { id: 'AI_RULES', label: 'Regras IA' },
    { id: 'CID', label: 'CID-10' }
  ];

  const canManageActiveTab = !(activeTab === 'GESTORAS' && userRole === UserRole.EMPRESA_GESTORA);

  const handleOpenCreate = () => {
    if (!canManageActiveTab) return;
    if (activeTab === 'PERFIS') {
      alert("Para criar novos usuários, utilize o sistema de convites de autenticação (Auth). Nesta aba gerencia-se apenas as propriedades do perfil.");
      return;
    }
    setIsNewRecord(true);
    let item: any = {};
    
    if (['PROCEDIMENTO', 'SADT', 'INSUMO', 'FARMACO'].includes(activeTab)) {
      item = { 
        code: '', 
        tuss_code: '',
        description: '', 
        fees_value: 0, 
        type: activeTab, 
        risk_rating: 'BAIXO RISCO', 
        coverage: 'COBERTO', 
        rationalization: '', 
        is_active: true
      };
    } else if (activeTab === 'AI_RULES') {
      item = { title: '', description: '', priority: 'MEDIA', is_active: true };
    } else if (activeTab === 'CID') {
      item = { code: '', description: '' };
    } else if (activeTab === 'AUDITORES') {
      item = { name: '', crm: '', uf: '', specialty: '', rqe: '', rating: 5.0, is_active: true, gestora_id: '', operator_ids: [], tipo_auditor: 'GENERALISTA' };
    } else {
      item = { 
        id: null, name: '', commercial_name: '', type: activeTab === 'GESTORAS' ? 'GESTORA' : 'OPERADORA', 
        status: 'ATIVO', cnpj: '', contact_name: '', contact_email: '', phone: '', landline: '', 
        address_line: '', address_number: '', neighborhood: '', city: '', uf: '', cep: '', parentId: null 
      };
    }
    
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    if (!canManageActiveTab) return;
    setIsNewRecord(false);
    const editObj = { ...item };
    if (activeTab === 'GESTORAS' || activeTab === 'OPERADORAS') {
      editObj.parentId = item.parentId || item.parent_id || null;
    }
    setEditingItem(editObj);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing || !canManageActiveTab) return;
    
    setIsProcessing(true);
    try {
      let response;
      const itemToSave = JSON.parse(JSON.stringify(editingItem));
      const commonFieldsToRemove = ['created_at', 'updated_at', 'links', 'tenant'];
      commonFieldsToRemove.forEach(f => delete itemToSave[f]);

      if (isNewRecord && (itemToSave.id === null || itemToSave.id === undefined)) {
        delete itemToSave.id;
      }

      if (activeTab === 'PERFIS') {
        response = await supabaseService.updateProfile(itemToSave);
      } else if (['PROCEDIMENTO', 'SADT', 'INSUMO', 'FARMACO'].includes(activeTab)) {
        itemToSave.fees_value = Number(itemToSave.fees_value);
        response = await supabaseService.upsertProcedure(itemToSave);
      } else if (activeTab === 'AI_RULES') {
        response = await supabaseService.upsertAIRule(itemToSave);
      } else if (activeTab === 'CID') {
        response = await supabaseService.upsertCid(itemToSave);
      } else if (activeTab === 'AUDITORES') {
        itemToSave.rating = Number(itemToSave.rating || 0);
        if (!itemToSave.gestora_id) delete itemToSave.gestora_id;
        response = await supabaseService.upsertAuditor(itemToSave);
      } else {
        if (itemToSave.parentId) {
          itemToSave.parent_id = itemToSave.parentId;
        }
        delete itemToSave.parentId;
        response = await supabaseService.upsertTenant(itemToSave);
      }
      
      if (response?.error) throw response.error;
      
      setIsModalOpen(false);
      onDataChange(); 
    } catch (err: any) {
      console.error("Erro na ação de persistência:", err);
      alert("ERRO AO GRAVAR DADOS:\n\n" + (err.message || JSON.stringify(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (item: any) => {
    if (isProcessing || !canManageActiveTab) return;
    if (activeTab === 'PERFIS') {
      alert("A exclusão de perfis deve ser realizada via gerenciador de Auth do Supabase por questões de segurança.");
      return;
    }
    if (!confirm("Confirmar exclusão definitiva do registro?")) return;
    
    setIsProcessing(true);
    try {
      let result;
      if (['PROCEDIMENTO', 'SADT', 'INSUMO', 'FARMACO'].includes(activeTab)) {
        result = await supabaseService.deleteProcedure(item.id);
      } else if (activeTab === 'AI_RULES') {
        result = await supabaseService.deleteAIRule(item.id);
      } else if (activeTab === 'CID') {
        result = await supabaseService.deleteCid(item.id || item.code);
      } else if (activeTab === 'AUDITORES') {
        result = await supabaseService.deleteAuditor(item.id);
      } else {
        result = await supabaseService.deleteTenant(item.id);
      }
      
      if (result?.error) throw result.error;
      onDataChange();
    } catch (err: any) {
      alert("ERRO AO EXCLUIR: " + (err.message || JSON.stringify(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStars = (rating: number) => {
    const r = Math.round(rating || 0);
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg key={star} className={`w-4 h-4 ${star <= r ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const currentTabLabel = tabs.find(t => t.id === activeTab)?.label || activeTab;

  return (
    <div className={`space-y-8 animate-in fade-in ${isProcessing ? 'cursor-wait' : ''}`}>
      <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">Governança Master</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Controle Central de Operações e Tabelas</p>
        </div>
        {canManageActiveTab && activeTab !== 'PERFIS' && (
          <button type="button" onClick={handleOpenCreate} disabled={isProcessing} className="bg-brand-primary text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-brand-dark transition-all disabled:opacity-50">
            {isProcessing ? 'Gravando...' : `Novo Registro em ${currentTabLabel}`}
          </button>
        )}
      </header>

      <div className="bg-white rounded-[3rem] border shadow-sm overflow-hidden">
        <div className="flex bg-slate-50 border-b overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`px-8 py-6 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-brand-primary border-b-4 border-b-brand-primary' : 'text-slate-400 hover:bg-slate-100'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-10">
          {activeTab === 'AUDITORES' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
              {auditors.map(a => {
                const linkedOps = tenants.filter(t => a.operator_ids?.includes(t.id));
                const gestora = tenants.find(t => t.id === a.gestora_id);

                return (
                  <div key={a.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 hover:border-brand-primary transition-all group shadow-sm hover:shadow-2xl relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 p-6">
                      <div className={`w-3 h-3 rounded-full ${a.is_active ? 'bg-brand-primary animate-pulse' : 'bg-slate-300'}`} title={a.is_active ? 'Ativo' : 'Inativo'}></div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-black text-brand-dark uppercase tracking-tighter leading-tight">{a.name}</h3>
                        <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border uppercase ${a.tipo_auditor === 'ESPECIALISTA' ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                          {a.tipo_auditor || 'GENERALISTA'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="inline-block bg-brand-primary/10 text-brand-primary text-[10px] font-black px-3 py-1 rounded-lg border border-brand-primary/10 uppercase">
                          CRM: {a.crm}-{a.uf}
                        </span>
                        {gestora && (
                          <span className="inline-block bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-1 rounded-md border border-slate-200 uppercase">
                            {gestora.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Especialidade Clínica</div>
                        <div className="text-xs font-bold text-slate-700 uppercase">{a.specialty}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase mt-1">RQE: {a.rqe || 'NÃO INFORMADO'}</div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2">Postos de Auditoria (Operadoras)</div>
                        <div className="flex flex-wrap gap-1.5">
                          {linkedOps.length > 0 ? linkedOps.map(op => (
                            <span key={op.id} className="bg-support-blue/20 text-brand-dark text-[8px] font-black px-2 py-0.5 rounded border border-support-blue/30 uppercase">
                              {op.name.slice(0, 15)}
                            </span>
                          )) : (
                            <span className="text-[9px] text-slate-300 italic px-2">Nenhuma Operadora Vinculada</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-2 pt-2">
                         <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Performance</div>
                         {renderStars(a.rating)}
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                      <div className="text-[9px] font-black text-slate-300 uppercase italic">ID: {a.id.slice(0,8)}...</div>
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenEdit(a)} className="w-10 h-10 bg-brand-primary/5 text-brand-primary rounded-xl flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all shadow-sm" title="Editar Auditor">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(a)} className="w-10 h-10 bg-brand-accent/5 text-brand-accent rounded-xl flex items-center justify-center hover:bg-brand-accent hover:text-white transition-all shadow-sm" title="Excluir Auditor">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1h4a1 1 0 001 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="text-[10px] font-black uppercase text-slate-400 border-b">
                <tr>
                  <th className="p-4">Identificação / Atributo</th>
                  <th className="p-4">Informações Técnicas</th>
                  <th className="p-4">Status / Governança</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {activeTab === 'PERFIS' && profiles.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 group">
                    <td className="p-4">
                      <div className="font-black text-brand-dark uppercase text-xs">{p.name}</div>
                      <div className="text-[9px] text-slate-400 font-mono uppercase">{p.email || 'SEM EMAIL'}</div>
                    </td>
                    <td className="p-4">
                       <div className="text-[10px] font-black text-brand-primary uppercase">Papel: {p.role}</div>
                       <div className="text-[9px] font-bold text-slate-500 uppercase">Especialidade: {p.specialty || '--'}</div>
                    </td>
                    <td className="p-4">
                       <div className={`text-[8px] font-black px-2 py-1 rounded border inline-block uppercase ${p.tipo_auditor === 'ESPECIALISTA' ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                          Tipo: {p.tipo_auditor || 'GENERALISTA'}
                       </div>
                    </td>
                    <td className="p-4 text-right">
                       <button type="button" onClick={() => handleOpenEdit(p)} className="text-brand-primary text-[10px] font-black uppercase hover:underline">Editar Perfil</button>
                    </td>
                  </tr>
                ))}

                {['PROCEDIMENTO', 'SADT', 'INSUMO', 'FARMACO'].includes(activeTab) && procedures.filter(p => p.type === activeTab).map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 group">
                    <td className="p-4">
                      <div className="font-black text-brand-primary">{p.tuss_code || p.code}</div>
                      <div className="text-[8px] text-slate-400 font-mono uppercase">CÓDIGO OFICIAL</div>
                    </td>
                    <td className="p-4 text-xs font-bold uppercase text-brand-dark">{p.description}</td>
                    <td className="p-4">
                      <div className="text-xs font-black text-slate-700">R$ {p.fees_value?.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                      <div className={`text-[8px] font-black uppercase ${p.risk_rating === 'RACIONALIZAÇÃO' ? 'text-brand-accent' : 'text-brand-primary'}`}>{p.risk_rating}</div>
                    </td>
                    <td className="p-4 text-right space-x-4">
                      <button type="button" onClick={() => handleOpenEdit(p)} className="text-brand-primary text-[10px] font-black uppercase hover:underline">Editar</button>
                      <button type="button" onClick={() => handleDelete(p)} className="text-brand-accent text-[10px] font-black uppercase hover:underline">Excluir</button>
                    </td>
                  </tr>
                ))}

                {(activeTab === 'GESTORAS' || activeTab === 'OPERADORAS') && tenants.filter(t => t.type === (activeTab === 'GESTORAS' ? 'GESTORA' : 'OPERADORA')).map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="font-bold text-sm uppercase text-brand-dark">{t.name}</div>
                      <div className="text-[9px] text-slate-400 font-mono">{t.cnpj || 'CNPJ NÃO INFORMADO'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-[10px] font-bold text-slate-600 uppercase">{t.contact_name || 'RESPONSÁVEL AUSENTE'}</div>
                      <div className="text-[9px] text-brand-primary font-bold">{t.contact_email || '--'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-[10px] font-bold text-slate-500 uppercase">{t.city || '--'}/{t.uf || '--'}</div>
                      <div className={`text-[8px] font-black px-3 py-1 rounded-full inline-block mt-1 ${t.status === 'ATIVO' ? 'bg-support-green/30 text-brand-primary border border-brand-primary/20' : 'bg-support-rose/30 text-brand-accent border border-brand-accent/20'}`}>{t.status}</div>
                    </td>
                    <td className="p-4 text-right space-x-4">
                      {canManageActiveTab ? (
                        <>
                          <button type="button" onClick={() => handleOpenEdit(t)} className="text-brand-primary text-[10px] font-black uppercase hover:underline">Editar</button>
                          <button type="button" onClick={() => handleDelete(t)} className="text-brand-accent text-[10px] font-black uppercase hover:underline">Excluir</button>
                        </>
                      ) : <span className="text-[9px] text-slate-300 italic">Somente Master</span>}
                    </td>
                  </tr>
                ))}
                
                {activeTab === 'AI_RULES' && aiRules.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-sm uppercase">{r.title}</td>
                    <td className="p-4 text-[10px] text-slate-400 font-bold truncate max-w-xs">{r.description}</td>
                    <td className="p-4">
                      <div className={`text-[8px] font-black px-3 py-1 rounded-full inline-block mb-1 ${r.is_active ? 'bg-support-green/30 text-brand-primary' : 'bg-slate-100 text-slate-400'}`}>
                          {r.is_active ? 'ATIVA' : 'INATIVA'}
                      </div>
                      <div className="block text-[10px] font-black text-slate-900 uppercase">Prioridade: {r.priority}</div>
                    </td>
                    <td className="p-4 text-right space-x-4">
                      <button type="button" onClick={() => handleOpenEdit(r)} className="text-brand-primary text-[10px] font-black uppercase">Editar</button>
                      <button type="button" onClick={() => handleDelete(r)} className="text-brand-accent text-[10px] font-black uppercase">Excluir</button>
                    </td>
                  </tr>
                ))}

                {activeTab === 'CID' && cids.map(c => (
                  <tr key={c.id || c.code} className="hover:bg-slate-50/50">
                    <td className="p-4 font-black text-brand-primary uppercase">{c.code}</td>
                    <td className="p-4 text-xs font-bold uppercase text-brand-dark">{c.description}</td>
                    <td className="p-4 text-[10px] text-slate-400 font-mono">ID: {c.id || '--'}</td>
                    <td className="p-4 text-right space-x-4">
                      <button type="button" onClick={() => handleOpenEdit(c)} className="text-brand-primary text-[10px] font-black uppercase">Editar</button>
                      <button type="button" onClick={() => handleDelete(c)} className="text-brand-accent text-[10px] font-black uppercase">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/95 backdrop-blur-md flex items-center justify-center p-6 z-[200]">
          <form onSubmit={handleSave} className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
            <div className="bg-brand-dark p-8 text-white flex justify-between items-center shrink-0 border-b border-white/10">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-brand-secondary rounded-2xl flex items-center justify-center text-brand-dark font-black">
                  {activeTab === 'AI_RULES' ? 'AI' : activeTab === 'AUDITORES' ? 'Dr' : activeTab === 'GESTORAS' ? 'G' : 'O'}
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">{isNewRecord ? 'Novo' : 'Editar'} {currentTabLabel}</h3>
                  <p className="text-[9px] font-black uppercase text-brand-secondary tracking-widest">Painel de Governança Institucional</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className="p-10 space-y-12 overflow-y-auto no-scrollbar">
              {activeTab === 'PERFIS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Nome do Perfil</label>
                    <input required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold uppercase focus:border-brand-primary outline-none" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Tipo de Auditor (Triagem)</label>
                    <select required className="w-full p-4 bg-brand-primary/5 border-2 border-brand-primary/20 rounded-2xl font-black focus:border-brand-primary outline-none" value={editingItem.tipo_auditor} onChange={e => setEditingItem({...editingItem, tipo_auditor: e.target.value})}>
                      <option value="GENERALISTA">GENERALISTA</option>
                      <option value="ESPECIALISTA">ESPECIALISTA</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Especialidade Alvo</label>
                    <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold uppercase focus:border-brand-primary outline-none" value={editingItem.specialty || ''} onChange={e => setEditingItem({...editingItem, specialty: e.target.value.toUpperCase()})} placeholder="EX: ORTOPEDIA" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Papel Administrativo</label>
                    <select required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-brand-primary outline-none" value={editingItem.role} onChange={e => setEditingItem({...editingItem, role: e.target.value})}>
                      <option value="AUDITOR_MEDICO">AUDITOR MÉDICO</option>
                      <option value="OPERADORA">OPERADORA</option>
                      <option value="EMPRESA_GESTORA">EMPRESA GESTORA</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'AUDITORES' && (
                <div className="space-y-10">
                  <section className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <span className="bg-brand-primary/10 text-brand-primary text-[10px] font-black px-3 py-1 rounded-lg">01</span>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cadastro de Auditor Médico</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Nome Completo</label>
                        <input required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold uppercase focus:border-brand-primary outline-none" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Tipo de Auditor</label>
                        <select className="w-full p-4 bg-brand-primary/5 border-2 border-brand-primary/20 rounded-2xl font-black focus:border-brand-primary outline-none" value={editingItem.tipo_auditor} onChange={e => setEditingItem({...editingItem, tipo_auditor: e.target.value})}>
                          <option value="GENERALISTA">GENERALISTA (TRIAGEM GERAL)</option>
                          <option value="ESPECIALISTA">ESPECIALISTA (FILA RESTRITA)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Especialidade Clínica</label>
                        <input required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold uppercase focus:border-brand-primary outline-none" value={editingItem.specialty} onChange={e => setEditingItem({...editingItem, specialty: e.target.value.toUpperCase()})} placeholder="EX: ORTOPEDIA" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">CRM (Número)</label>
                        <input required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-brand-primary outline-none" value={editingItem.crm} onChange={e => setEditingItem({...editingItem, crm: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">UF CRM</label>
                        <input required maxLength={2} className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black uppercase focus:border-brand-primary outline-none" value={editingItem.uf} onChange={e => setEditingItem({...editingItem, uf: e.target.value.toUpperCase()})} placeholder="EX: SP" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">RQE (Opcional)</label>
                        <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-brand-primary outline-none" value={editingItem.rqe || ''} onChange={e => setEditingItem({...editingItem, rqe: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Avaliação (Rating 0-5)</label>
                        <input type="number" step="0.1" min="0" max="5" required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-brand-primary outline-none" value={editingItem.rating} onChange={e => setEditingItem({...editingItem, rating: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Status</label>
                        <select className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-brand-primary outline-none" value={editingItem.is_active ? 'true' : 'false'} onChange={e => setEditingItem({...editingItem, is_active: e.target.value === 'true'})}>
                          <option value="true">ATIVO / HABILITADO</option>
                          <option value="false">INATIVO / BLOQUEADO</option>
                        </select>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <span className="bg-brand-primary/10 text-brand-primary text-[10px] font-black px-3 py-1 rounded-lg">02</span>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vinculação Institucional Hierárquica</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      <div className="md:col-span-1 space-y-2">
                        <label className="text-[10px] font-black text-brand-primary uppercase tracking-widest px-2">01. Selecionar Gestora (Obrigatório)</label>
                        <select required className="w-full p-4 bg-brand-primary/5 border-2 border-brand-primary/20 rounded-2xl font-black focus:border-brand-primary outline-none" value={editingItem.gestora_id || ''} onChange={e => setEditingItem({...editingItem, gestora_id: e.target.value, operator_ids: []})}>
                          <option value="">VINCULAR À GESTORA...</option>
                          {tenants.filter(t => t.type === 'GESTORA').map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      </div>

                      <div className="md:col-span-3 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">02. Selecionar Postos de Atuação (Operadoras Vinculadas)</label>
                        {editingItem.gestora_id ? (
                          <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-transparent grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {tenants.filter(t => t.type === 'OPERADORA' && t.parent_id === editingItem.gestora_id).map(op => {
                              const isChecked = editingItem.operator_ids?.includes(op.id);
                              return (
                                <label key={op.id} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${isChecked ? 'bg-white border-brand-primary shadow-sm' : 'bg-white/50 border-slate-100 opacity-60'}`}>
                                  <input type="checkbox" className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary border-slate-300" checked={isChecked} onChange={e => {
                                      const ids = editingItem.operator_ids || [];
                                      if (e.target.checked) setEditingItem({...editingItem, operator_ids: [...ids, op.id]});
                                      else setEditingItem({...editingItem, operator_ids: ids.filter((id: string) => id !== op.id)});
                                    }}
                                  />
                                  <div className="overflow-hidden">
                                    <div className={`text-[10px] font-black uppercase truncate ${isChecked ? 'text-brand-primary' : 'text-slate-500'}`}>{op.name}</div>
                                    <div className="text-[8px] font-bold text-slate-400 uppercase truncate">CNPJ: {op.cnpj || '---'}</div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-slate-50 p-10 rounded-[2rem] border-2 border-dashed border-slate-200 text-center">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aguardando Seleção de Gestora...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {(activeTab === 'GESTORAS' || activeTab === 'OPERADORAS') && (
                <div className="space-y-12">
                  <section className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <span className="bg-brand-primary/10 text-brand-primary text-[10px] font-black px-3 py-1 rounded-lg">01</span>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação Institucional</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Razão Social (Nome Oficial)</label>
                        <input required className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold uppercase focus:border-brand-primary outline-none" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Status do Tenant</label>
                        <select className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-brand-primary outline-none" value={editingItem.status} onChange={e => setEditingItem({...editingItem, status: e.target.value})}>
                          <option value="ATIVO">ATIVO / EM OPERAÇÃO</option>
                          <option value="INATIVO">INATIVO / BLOQUEADO</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Nome Fantasia (Comercial)</label>
                        <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold uppercase focus:border-brand-primary outline-none" value={editingItem.commercial_name || ''} onChange={e => setEditingItem({...editingItem, commercial_name: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">CNPJ / Identificador</label>
                        <input className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-mono font-bold focus:border-brand-primary outline-none" value={editingItem.cnpj || ''} onChange={e => setEditingItem({...editingItem, cnpj: e.target.value})} placeholder="00.000.000/0000-00" />
                      </div>
                      {activeTab === 'OPERADORAS' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-brand-primary uppercase tracking-widest px-2">Gestora Responsável (Vínculo)</label>
                          <select required className="w-full p-4 bg-brand-primary/5 border-2 border-brand-primary/20 rounded-2xl font-black focus:border-brand-primary outline-none" value={editingItem.parentId || ''} onChange={e => setEditingItem({...editingItem, parentId: e.target.value})}>
                            <option value="">VINCULAR À GESTORA...</option>
                            {tenants.filter(t => t.type === 'GESTORA').map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {['PROCEDIMENTO', 'SADT', 'INSUMO', 'FARMACO'].includes(activeTab) && (
                <div className="space-y-12">
                  <section className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <span className="bg-brand-primary/10 text-brand-primary text-[10px] font-black px-3 py-1 rounded-lg">01</span>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação TUSS Oficial</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Código TUSS (Oficial ANS)</label>
                        <input required className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-brand-primary outline-none" value={editingItem.tuss_code} onChange={e => setEditingItem({...editingItem, tuss_code: e.target.value.toUpperCase(), code: e.target.value.toUpperCase()})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Valor de Tabela (Honorários R$)</label>
                        <input type="number" step="0.01" required className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-brand-primary outline-none" value={editingItem.fees_value} onChange={e => setEditingItem({...editingItem, fees_value: e.target.value})} />
                      </div>
                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Descrição Técnica Oficial (ANS)</label>
                        <input required className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-brand-primary outline-none" value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value.toUpperCase()})} />
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'AI_RULES' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Título da Diretriz Inteligente</label>
                      <input required className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-brand-primary outline-none" value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} placeholder="Ex: Racionalização de Terapias Especiais" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Prioridade de Aplicação</label>
                      <select className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl font-black focus:border-brand-primary outline-none" value={editingItem.priority} onChange={e => setEditingItem({...editingItem, priority: e.target.value})}>
                        <option value="ALTA">ALTA (IMPEDIMENTO)</option>
                        <option value="MEDIA">MÉDIA (REVISÃO TÉCNICA)</option>
                        <option value="BAIXA">BAIXA (NOTIFICAR APENAS)</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Comportamento Lógico (Instrução para IA)</label>
                    <textarea required rows={6} className="w-full p-8 bg-slate-50 border-2 border-transparent rounded-[2rem] font-bold focus:border-brand-primary outline-none leading-relaxed" value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} />
                  </div>
                </div>
              )}

              {activeTab === 'CID' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Código CID-10</label>
                    <input required className="w-full p-5 bg-slate-50 rounded-2xl font-black border-2 border-transparent focus:border-brand-primary outline-none" value={editingItem.code} onChange={e => setEditingItem({...editingItem, code: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="col-span-3 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Descrição Patológica</label>
                    <input required className="w-full p-5 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-brand-primary outline-none" value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value.toUpperCase()})} />
                  </div>
                </div>
              )}
            </div>

            <div className="p-10 bg-slate-50 flex gap-4 border-t shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-6 bg-white border-2 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-slate-100 transition-all">Descartar</button>
              <button type="submit" disabled={isProcessing} className="flex-[2] py-6 bg-brand-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl hover:bg-brand-dark transition-all disabled:opacity-50">
                {isProcessing ? 'Sincronizando...' : `Confirmar e Salvar ${currentTabLabel}`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
