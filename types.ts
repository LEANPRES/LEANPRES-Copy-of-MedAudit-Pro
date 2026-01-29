
export enum UserRole {
  ADMIN_MASTER = 'ADMIN_MASTER',
  EMPRESA_GESTORA = 'EMPRESA_GESTORA',
  OPERADORA = 'OPERADORA',
  AUDITOR_MEDICO = 'AUDITOR_MEDICO'
}

export type AuditorType = 'GENERALISTA' | 'ESPECIALISTA';

export type WorkflowStep = 'ADMINISTRATIVE' | 'AUDIT' | 'RELEASE' | 'FINISHED';

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  url?: string; 
}

export interface AIRule {
  id: string;
  title: string;
  description: string;
  is_active: boolean;
  priority: 'ALTA' | 'MEDIA' | 'BAIXA';
}

export interface WorkflowDocument {
  id: string;
  name: string;
  required: boolean;
  files: FileMetadata[];
}

export interface MedicalAuditor {
  id: string;
  name: string;
  crm: string;
  uf: string;
  specialty: string;
  tipo_auditor?: AuditorType;
  rqe?: string;
  rating: number;
  is_active: boolean;
  gestora_id?: string;
  operator_ids?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface TimelineEvent {
  id: string;
  step: WorkflowStep;
  user: string;
  role: UserRole;
  description: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  tenantId?: string;
  tenantCommercialName?: string;
  parentTenantId?: string;
  tipo_auditor?: AuditorType;
  especialidade?: string;
}

export interface Tenant {
  id: string;
  name: string; 
  commercial_name?: string; 
  type: 'GESTORA' | 'OPERADORA';
  parentId?: string;
  parent_id?: string; 
  status: 'ATIVO' | 'INATIVO';
  cnpj?: string;
  contact_name?: string;
  contact_email?: string;
  phone?: string; 
  landline?: string; 
  address_line?: string; 
  address_number?: string; 
  neighborhood?: string; 
  city?: string; 
  uf?: string; 
  cep?: string; 
  created_at: string; 
}

export interface Beneficiary {
  id: string;
  name: string;
  cardId: string;
  birthDate: string;
  gender?: string;
}

export interface Procedure {
  id: number;
  code: string; 
  tuss_code: string; 
  description: string;
  fees_value: number; 
  risk_rating: 'BAIXO RISCO' | 'RACIONALIZAÇÃO'; 
  rationalization: string; 
  coverage: 'COBERTO' | 'SEM_COBERTURA'; 
  type: 'SADT' | 'OPME' | 'PROCEDIMENTO' | 'FARMACO' | 'TAXA' | 'INSUMO';
  is_active: boolean; 
}

export interface AuditItem {
  id: string;
  procedure_id?: number;
  procedure: Procedure;
  quantityRequested: number;
  quantityAuthorized: number;
  unitValue: number; 
  totalValue?: number; 
  status: 'PENDING' | 'FAVORABLE' | 'UNFAVORABLE' | 'PARTIAL';
  justification?: string;
}

export interface AuditRequest {
  id: string;
  tenant_id?: string;
  operatorId: string;
  auditorId?: string;
  beneficiary: Beneficiary;
  cid10: string;
  items: AuditItem[];
  status: 'DRAFT' | 'PENDING_AUDIT' | 'COMPLETED' | 'CANCELED' | 'RETURNED_TO_OPERATOR';
  workflowStep: WorkflowStep;
  especialidade_alvo?: string;
  documents: WorkflowDocument[];
  history: TimelineEvent[];
  authCode?: string;
  createdAt: string;
  lastUpdate: string;
  clinicalSummary: string;
  
  // Campos Administrativos TISS
  guiaNumber?: string;
  requestDate?: string;
  requestingUnimed?: string;
  serviceType?: string;
  requestCharacter?: number;
  accidentIndication?: number;
  serviceDate?: string;
  coAuthorization?: boolean;
  executingUnimed?: string;
  executingUnimedCity?: string;
  transactionNumber?: string;
}

export interface ChatMessage {
  id: string;
  requestId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  timestamp: string;
  attachment?: string;
  visibility: string;
}

export interface AIDecisionSupport {
  recommendation: 'APPROVE' | 'REJECT' | 'PARTIAL';
  confidence: number;
  reasoning: string;
  regulatoryReferences: string[];
}

export type AppView = 'LANDING' | 'LIST' | 'CREATE' | 'DETAILS' | 'ADMIN' | 'DASHBOARD' | 'DASHBOARD_OPERATIONAL' | 'DASHBOARD_MANAGERIAL' | 'MEDICAL_AUDIT' | 'RECORDS';
