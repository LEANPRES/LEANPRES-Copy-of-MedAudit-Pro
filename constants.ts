
import { Procedure, User, UserRole, Tenant, MedicalAuditor } from './types';

// IDs sincronizados com o script migrations.sql
export const GESTORA_ID = 'd1111111-1111-1111-1111-111111111111';
export const OPERADORA_ID = 'd2222222-2222-2222-2222-222222222222';

export const MOCK_PROCEDURES: Procedure[] = [
  { 
    id: 1, 
    code: '31009166', 
    tuss_code: '31009166', 
    description: 'HERNIORRAFIA UMBILICAL', 
    type: 'PROCEDIMENTO', 
    fees_value: 1250.00, 
    risk_rating: 'RACIONALIZAÇÃO', 
    rationalization: 'Procedimento padrão para correção de hérnia umbilical conforme diretrizes da SBC.', 
    coverage: 'COBERTO', 
    is_active: true 
  },
  { 
    id: 2, 
    code: '40304361', 
    tuss_code: '40304361', 
    description: 'HEMOGRAMA COMPLETO', 
    type: 'SADT', 
    fees_value: 35.00, 
    risk_rating: 'BAIXO RISCO', 
    rationalization: 'Exame laboratorial de rotina.', 
    coverage: 'COBERTO', 
    is_active: true 
  }
];

export const MOCK_USERS: User[] = [
  { id: '00000000-0000-0000-0000-000000000000', name: 'Dr. Silva Master', role: UserRole.ADMIN_MASTER },
  { id: '11111111-1111-1111-1111-111111111111', name: 'Gestor Saúde Brasil', role: UserRole.EMPRESA_GESTORA, tenantId: GESTORA_ID },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Atendimento Unimed', role: UserRole.OPERADORA, tenantId: OPERADORA_ID, parentTenantId: GESTORA_ID },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Dr. Auditor Carlos', role: UserRole.AUDITOR_MEDICO, tenantId: OPERADORA_ID }
];

export const MOCK_TENANTS: Tenant[] = [
  { 
    id: GESTORA_ID, 
    name: 'Alfa Gestão de Auditoria', 
    commercial_name: 'ALFA AUDIT',
    type: 'GESTORA', 
    status: 'ATIVO',
    cnpj: '11.111.111/0001-11',
    created_at: new Date().toISOString()
  },
  { 
    id: OPERADORA_ID, 
    name: 'Unimed Regional Pro', 
    type: 'OPERADORA', 
    parentId: GESTORA_ID, 
    status: 'ATIVO',
    cnpj: '22.222.222/0001-22',
    created_at: new Date().toISOString()
  }
];

export const CID10_LIST = [
  { code: 'K42.9', description: 'Hérnia umbilical sem obstrução ou gangrena' },
  { code: 'I10', description: 'Hipertensão essencial (primária)' },
  { code: 'M54.5', description: 'Dor lombar baixa' }
];
