
import { supabase } from '../lib/supabase';
import { AuditRequest, AIRule, Procedure, Tenant, UserRole, AuditItem, ChatMessage, User, WorkflowDocument, MedicalAuditor } from '../types';

export const supabaseService = {
  // --- AUTH & PROFILES ---
  async login(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
  },

  async logout() {
    return await supabase.auth.signOut();
  },

  async getCurrentProfile(userId: string) {
    return await supabase
      .from('profiles')
      .select('*, tenant:tenants(*)')
      .eq('id', userId)
      .maybeSingle();
  },

  async getAllProfiles() {
    return await supabase.from('profiles').select('*').order('name');
  },

  async updateProfile(profile: any) {
    const { id, ...updates } = profile;
    return await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select();
  },

  // --- DOCUMENT TEMPLATES ---
  async getDocumentTemplates(tenantId?: string) {
    let query = supabase.from('document_templates').select('*');
    if (tenantId) {
      query = query.or(`tenant_id.is.null,tenant_id.eq.${tenantId}`);
    } else {
      query = query.is('tenant_id', null);
    }
    return await query.order('created_at');
  },

  // --- STORAGE ---
  async uploadFile(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `audit_docs/${fileName}`;

    const { data, error } = await supabase.storage
      .from('medical-documents')
      .upload(filePath, file);

    if (error) return { data: null, error };

    const { data: { publicUrl } } = supabase.storage
      .from('medical-documents')
      .getPublicUrl(filePath);

    return { data: { name: file.name, url: publicUrl, size: file.size, type: file.type, lastModified: Date.now() }, error: null };
  },

  // --- CHAT P2P ---
  async getMessages(requestId: string) {
    return await supabase
      .from('audit_messages')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });
  },

  async sendMessage(message: Partial<ChatMessage>) {
    return await supabase
      .from('audit_messages')
      .insert([{
        request_id: message.requestId,
        sender_id: message.senderId,
        sender_name: message.senderName,
        sender_role: message.senderRole,
        content: message.content,
        visibility: 'ALL'
      }])
      .select();
  },

  subscribeToMessages(requestId: string, onMessage: (msg: ChatMessage) => void) {
    return supabase
      .channel(`chat-${requestId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'audit_messages',
        filter: `request_id=eq.${requestId}`
      }, (payload) => {
        const msg = payload.new as any;
        if (msg) {
          onMessage({
            id: msg.id,
            requestId: msg.request_id,
            senderId: msg.sender_id,
            senderName: msg.sender_name,
            senderRole: msg.sender_role as UserRole,
            content: msg.content,
            timestamp: msg.created_at || new Date().toISOString(),
            visibility: 'ALL'
          });
        }
      })
      .subscribe();
  },

  // --- TENANTS ---
  async getTenants() {
    return await supabase.from('tenants').select('*').order('name');
  },

  async upsertTenant(tenant: Partial<Tenant>) {
    const payload: any = { ...tenant };
    delete payload.parentId; 
    return await supabase.from('tenants').upsert(payload, { onConflict: 'id' }).select();
  },

  async deleteTenant(id: string) {
    return await supabase.from('tenants').delete().eq('id', id);
  },

  // --- MEDICAL AUDITORS ---
  async getAuditors() {
    const { data: auditors, error } = await supabase
      .from('medical_auditors')
      .select(`
        *,
        links:auditors_operators_link(operator_id)
      `)
      .order('name');

    if (error) return { data: null, error };

    const formatted = auditors.map((a: any) => ({
      ...a,
      operator_ids: a.links ? a.links.map((l: any) => l.operator_id) : []
    }));

    return { data: formatted, error: null };
  },

  async upsertAuditor(auditor: Partial<MedicalAuditor>) {
    const payload: any = { ...auditor };
    const operatorIds = Array.isArray(payload.operator_ids) ? payload.operator_ids : [];
    
    delete payload.operator_ids;
    delete payload.links;
    
    if (!payload.id || payload.id === '') {
      delete payload.id;
    }

    const { data, error: auditorError } = await supabase
      .from('medical_auditors')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (auditorError) return { data: null, error: auditorError };

    const auditorId = data.id;

    const { error: rpcError } = await supabase.rpc('link_auditor_to_operators', {
      p_auditor_id: auditorId,
      p_operator_ids: operatorIds
    });

    if (rpcError) {
      console.error("Erro ao sincronizar vínculos via RPC:", rpcError);
      return { data, error: rpcError };
    }

    return { data, error: null };
  },

  async deleteAuditor(id: string) {
    return await supabase.from('medical_auditors').delete().eq('id', id);
  },

  // --- PROCEDURES ---
  async getProcedures() {
    return await supabase.from('procedures').select('*').order('description');
  },

  async upsertProcedure(proc: Partial<Procedure>) {
    const payload: any = { ...proc };
    if (!payload.id) delete payload.id;
    const conflictTarget = payload.id ? 'id' : 'code';
    return await supabase.from('procedures')
      .upsert(payload, { onConflict: conflictTarget })
      .select();
  },

  async deleteProcedure(id: number) {
    return await supabase.from('procedures').delete().eq('id', id);
  },

  // --- REQUISIÇÕES E ITENS ---
  async getRequests(role: UserRole, tenantId?: string) {
    let query = supabase.from('audit_requests').select(`
      *,
      items:audit_request_items(
        *,
        procedure:procedures(*)
      )
    `);

    if (tenantId && role !== UserRole.ADMIN_MASTER) {
      query = query.eq('tenant_id', tenantId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) return { data: null, error };

    const mappedData = (data || []).map(row => {
      const mappedBeneficiary = {
        id: row.beneficiary?.id || `b-${row.id}`,
        name: row.benef_name || row.beneficiary?.name || '',
        cardId: row.benef_card_id || row.beneficiary?.cardId || '',
        gender: row.benef_gender || row.beneficiary?.gender || 'NÃO DECLAROU',
        birthDate: row.benef_birth_date || row.beneficiary?.birthDate || ''
      };

      return {
        ...row,
        beneficiary: mappedBeneficiary,
        // Novos mapeamentos TISS
        guiaNumber: row.guia_number,
        requestDate: row.request_date,
        requestingUnimed: row.requesting_unimed,
        serviceType: row.service_type,
        requestCharacter: row.request_character,
        accidentIndication: row.accident_indication,
        serviceDate: row.service_date,
        coAuthorization: row.co_authorization,
        executingUnimed: row.executing_unimed,
        executingUnimedCity: row.executing_unimed_city,
        transactionNumber: row.transaction_number
      };
    });

    return { data: mappedData, error: null };
  },

  async createRequest(request: Partial<AuditRequest>, tenantId: string) {
    const { data: reqData, error: reqError } = await supabase.from('audit_requests').insert([{
      tenant_id: tenantId,
      beneficiary: request.beneficiary,
      benef_name: request.beneficiary?.name,
      benef_card_id: request.beneficiary?.cardId,
      benef_gender: request.beneficiary?.gender,
      benef_birth_date: request.beneficiary?.birthDate,
      
      // Novos Campos TISS
      guia_number: request.guiaNumber,
      request_date: request.requestDate,
      requesting_unimed: request.requestingUnimed,
      service_type: request.serviceType,
      request_character: request.requestCharacter,
      accident_indication: request.accidentIndication,
      service_date: request.serviceDate,
      co_authorization: request.coAuthorization,
      executing_unimed: request.executingUnimed,
      executing_unimed_city: request.executingUnimedCity,
      transaction_number: request.transactionNumber,
      
      cid10: request.cid10,
      clinical_summary: request.clinicalSummary,
      workflow_step: request.workflowStep || 'ADMINISTRATIVE',
      status: request.status || 'PENDING_AUDIT',
      history: request.history || [],
      documents: request.documents || []
    }]).select();

    if (reqError) return { data: null, error: reqError };

    const newRequestId = reqData[0].id;

    const itemsPayload = (request.items || []).map(item => ({
      request_id: newRequestId,
      procedure_id: item.procedure.id,
      quantity_requested: item.quantityRequested,
      unit_value: item.procedure.fees_value,
      quantity_authorized: item.quantityAuthorized,
      status: item.status,
      justification: item.justification
    }));

    const { error: itemError } = await supabase.from('audit_request_items').insert(itemsPayload);
    
    return { data: reqData, error: itemError };
  },

  async updateRequestStatus(id: string, step: string, status: string, history: any[], items?: AuditItem[], documents?: any[], metadata?: Partial<AuditRequest>) {
    const payload: any = { 
      workflow_step: step, 
      status, 
      history, 
      last_update: new Date().toISOString() 
    };
    
    if (step === 'FINISHED') {
      const { data: authCodeData } = await supabase.rpc('generate_auth_code');
      payload.auth_code = authCodeData;
    }

    if (documents) {
      payload.documents = documents;
    }

    if (metadata) {
      if (metadata.beneficiary) {
        payload.beneficiary = metadata.beneficiary;
        payload.benef_name = metadata.beneficiary.name;
        payload.benef_card_id = metadata.beneficiary.cardId;
        payload.benef_gender = metadata.beneficiary.gender;
        payload.benef_birth_date = metadata.beneficiary.birthDate;
      }
      if (metadata.cid10) payload.cid10 = metadata.cid10;
      if (metadata.clinicalSummary) payload.clinical_summary = metadata.clinicalSummary;
      if (metadata.especialidade_alvo !== undefined) payload.especialidade_alvo = metadata.especialidade_alvo;
      
      // Atualização dos campos TISS em lote
      if (metadata.guiaNumber !== undefined) payload.guia_number = metadata.guiaNumber;
      if (metadata.requestDate !== undefined) payload.request_date = metadata.requestDate;
      if (metadata.requestingUnimed !== undefined) payload.requesting_unimed = metadata.requestingUnimed;
      if (metadata.serviceType !== undefined) payload.service_type = metadata.serviceType;
      if (metadata.requestCharacter !== undefined) payload.request_character = metadata.requestCharacter;
      if (metadata.accidentIndication !== undefined) payload.accident_indication = metadata.accidentIndication;
      if (metadata.serviceDate !== undefined) payload.service_date = metadata.serviceDate;
      if (metadata.coAuthorization !== undefined) payload.co_authorization = metadata.coAuthorization;
      if (metadata.executingUnimed !== undefined) payload.executing_unimed = metadata.executingUnimed;
      if (metadata.executingUnimedCity !== undefined) payload.executing_unimed_city = metadata.executingUnimedCity;
      if (metadata.transactionNumber !== undefined) payload.transaction_number = metadata.transactionNumber;
    }

    const { error: reqError } = await supabase.from('audit_requests')
      .update(payload)
      .eq('id', id);

    if (reqError) return { error: reqError };

    if (items) {
      for (const item of items) {
        await supabase.from('audit_request_items')
          .update({
            quantity_authorized: item.quantityAuthorized,
            status: item.status,
            justification: item.justification
          })
          .eq('id', item.id);
      }
    }

    return { error: null };
  },

  async searchProcedures(term: string) {
    return await supabase.from('procedures').select('*').or(`code.ilike.%${term}%,description.ilike.%${term}%`).limit(15);
  },

  async getAIRules() {
    return await supabase.from('ai_rules').select('*').order('created_at', { ascending: false });
  },

  async upsertAIRule(rule: AIRule) {
    return await supabase.from('ai_rules').upsert(rule).select();
  },

  async deleteAIRule(id: string) {
    return await supabase.from('ai_rules').delete().eq('id', id);
  },

  async getCids() {
    return await supabase.from('cids').select('*').order('code');
  },

  async upsertCid(cid: any) {
    return await supabase.from('cids').upsert(cid, { onConflict: 'code' }).select();
  },

  async deleteCid(idOrCode: any) {
    if (typeof idOrCode === 'number') {
      return await supabase.from('cids').delete().eq('id', idOrCode);
    }
    return await supabase.from('cids').delete().eq('code', idOrCode);
  }
};
