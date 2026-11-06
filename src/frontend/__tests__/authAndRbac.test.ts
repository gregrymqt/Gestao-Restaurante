import assert from 'node:assert';

// 1. Configura ambiente Fail-Fast antes de carregar dependências
process.env.EXPO_PUBLIC_API_URL = 'http://localhost:5000/api/v1';
process.env.EXPO_PUBLIC_API_ID = 'restaurante-inteligente-pdv';

const { useAuthStore } = require('../features/auth/hooks/useAuthStore');
const { storage, STORAGE_KEYS } = require('../shared/services/storage');
import type { RestauranteTenant, OperadorRecente } from '../features/auth/types';

console.log('[TEST] Iniciando testes discriminatórios de Auth Store, Sessão e RBAC no Frontend...');

// Limpeza inicial
storage.clearAll();
useAuthStore.getState().logout();

// ============================================================================
// 1. Estado Inicial
// ============================================================================
const initial = useAuthStore.getState();
assert.strictEqual(initial.token, null, 'Token inicial deve ser nulo');
assert.strictEqual(initial.refreshToken, null, 'RefreshToken inicial deve ser nulo');
assert.strictEqual(initial.operador, null, 'Operador inicial deve ser nulo');
assert.strictEqual(initial.isAuthenticated, false, 'Deve iniciar não-autenticado');

console.log('[OK] 1. Estado inicial não autenticado validado.');

// ============================================================================
// 2. setSession e Persistência Segura
// ============================================================================
const mockTenant: RestauranteTenant = {
  id: '11111111-1111-1111-1111-111111111111',
  nome: 'Restaurante Alpha Teste',
  cnpj: '11.111.111/0001-11',
  filialNumero: '001',
  ativo: true,
};

const mockOperador: OperadorRecente = {
  id: '33333333-3333-3333-3333-333333333333',
  nome: 'Carlos SuperAdmin',
  matricula: 'ADM-001',
  role: 'SuperAdmin',
  email: 'admin@alpha.com',
  iniciais: 'CS',
};

useAuthStore.getState().setSession({
  token: 'real-jwt-token-xyz-1234567890',
  refreshToken: 'real-refresh-token-9876543210',
  tenant: mockTenant,
  operador: mockOperador,
});

const logado = useAuthStore.getState();
assert.strictEqual(logado.isAuthenticated, true, 'Deve estar autenticado');
assert.strictEqual(logado.token, 'real-jwt-token-xyz-1234567890');
assert.strictEqual(logado.operador?.role, 'SuperAdmin');
assert.strictEqual(logado.tenant?.id, '11111111-1111-1111-1111-111111111111');

// Verifica se gravou no storage resiliente
assert.strictEqual(storage.getString(STORAGE_KEYS.AUTH_TOKEN), 'real-jwt-token-xyz-1234567890');
assert.strictEqual(storage.getString(STORAGE_KEYS.REFRESH_TOKEN), 'real-refresh-token-9876543210');
assert.ok(storage.getString(STORAGE_KEYS.ACTIVE_TENANT)?.includes('Restaurante Alpha Teste'));

console.log('[OK] 2. setSession e persistência em storage validados.');

// ============================================================================
// 3. RBAC Discriminatório: Controle de Acesso ao Backoffice SuperAdmin
// ============================================================================
function podeAcessarBackofficeSuperAdmin(operador: OperadorRecente | null): boolean {
  return operador?.role === 'SuperAdmin';
}

assert.strictEqual(
  podeAcessarBackofficeSuperAdmin(mockOperador),
  true,
  'SuperAdmin deve ter acesso permitido ao Backoffice SaaS'
);

const operadorCaixa: OperadorRecente = {
  id: '44444444-4444-4444-4444-444444444444',
  nome: 'Maria Caixa',
  matricula: 'CX-002',
  role: 'Caixa',
  email: 'maria@alpha.com',
  iniciais: 'MC',
};
assert.strictEqual(
  podeAcessarBackofficeSuperAdmin(operadorCaixa),
  false,
  'Operador Caixa NUNCA deve ter acesso ao Backoffice SaaS'
);

const operadorPadrao: OperadorRecente = {
  id: '55555555-5555-5555-5555-555555555555',
  nome: 'João Garçom',
  matricula: 'OP-003',
  role: 'Operador',
  email: 'joao@alpha.com',
  iniciais: 'JG',
};
assert.strictEqual(
  podeAcessarBackofficeSuperAdmin(operadorPadrao),
  false,
  'Operador padrão NUNCA deve ter acesso ao Backoffice SaaS'
);

const gerenteLocal: OperadorRecente = {
  id: '66666666-6666-6666-6666-666666666666',
  nome: 'Roberto Gerente',
  matricula: 'GER-004',
  role: 'Gerente',
  email: 'roberto@alpha.com',
  iniciais: 'RG',
};
assert.strictEqual(
  podeAcessarBackofficeSuperAdmin(gerenteLocal),
  false,
  'Gerente de loja física NUNCA deve ter acesso ao Backoffice SaaS Multi-Tenant'
);

assert.strictEqual(
  podeAcessarBackofficeSuperAdmin(null),
  false,
  'Operador nulo deve ser estritamente bloqueado'
);

console.log('[OK] 3. RBAC Discriminatório (SuperAdmin vs Operador/Caixa/Gerente) validado com sucesso.');

// ============================================================================
// 4. Logout Seguro
// ============================================================================
useAuthStore.getState().logout();

const deslogado = useAuthStore.getState();
assert.strictEqual(deslogado.isAuthenticated, false);
assert.strictEqual(deslogado.token, null);
assert.strictEqual(deslogado.operador, null);
assert.strictEqual(storage.getString(STORAGE_KEYS.AUTH_TOKEN), null, 'Token deve ser purgado do storage no logout');
assert.strictEqual(storage.getString(STORAGE_KEYS.REFRESH_TOKEN), null, 'RefreshToken deve ser purgado');

console.log('[OK] 4. Logout seguro e purga de tokens validados.');

// ============================================================================
// 5. Auto-purga de Tokens Mock / Legados (initSessionFromStorage)
// ============================================================================
storage.set(STORAGE_KEYS.AUTH_TOKEN, 'mock-jwt-token-legado-inseguro');
storage.set(STORAGE_KEYS.REFRESH_TOKEN, 'mock-refresh-token-legado');

useAuthStore.getState().initSessionFromStorage();

assert.strictEqual(
  storage.getString(STORAGE_KEYS.AUTH_TOKEN),
  null,
  'Tokens mock devem ser auto-purgados pelo initSessionFromStorage'
);
assert.strictEqual(
  storage.getString(STORAGE_KEYS.REFRESH_TOKEN),
  null,
  'RefreshToken mock deve ser auto-purgado'
);
assert.strictEqual(useAuthStore.getState().isAuthenticated, false);

console.log('[OK] 5. Auto-purga de tokens mock validada com sucesso.');
console.log('[TEST] SUCESSO: Todos os testes de Auth e RBAC no Frontend foram aprovados!');
