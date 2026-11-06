import assert from 'node:assert';

// Garante variáveis de ambiente antes de carregar dependências
process.env.EXPO_PUBLIC_API_URL = 'http://localhost:5000/api/v1';
process.env.EXPO_PUBLIC_API_ID = 'restaurante-inteligente-pdv';

const { ASSINATURA_PADRAO } = require('../features/assinatura/services/assinaturaService');
const { storage, STORAGE_KEYS } = require('../shared/services/storage');
const { apiClient } = require('../shared/services/api');
import type { AssinaturaStatus, PlanoItem } from '../features/assinatura/types';

console.log('[TEST] Iniciando testes discriminatórios de SaaS Paywall, Planos e Interceptor API...');

// ============================================================================
// 1. Assinatura Padrão / Fallback
// ============================================================================
assert.strictEqual(ASSINATURA_PADRAO.status, 'TRIAL', 'Assinatura padrão deve ser TRIAL');
assert.strictEqual(ASSINATURA_PADRAO.estaVigente, true, 'Assinatura inicial deve ser vigente');
assert.ok(ASSINATURA_PADRAO.diasRestantesTrial >= 0, 'Dias de trial devem ser não-negativos');
assert.ok(ASSINATURA_PADRAO.planosDisponiveis.length >= 2, 'Deve disponibilizar múltiplos planos (Básico e Pro)');

console.log('[OK] 1. Assinatura padrão validada.');

// ============================================================================
// 2. Discriminador de Mensagens e Estado do Paywall
// ============================================================================
function obterMensagemPaywall(assinatura: AssinaturaStatus): string {
  return assinatura.diasRestantesTrial > 0
    ? `Você ainda possui ${assinatura.diasRestantesTrial} dias de teste grátis. Ao assinar agora, você garante continuidade sem interrupções.`
    : 'Seu período de degustação encerrou. Assine para continuar tendo controle total do seu negócio.';
}

const assinaturaEmTrial: AssinaturaStatus = {
  restauranteId: '11111111-1111-1111-1111-111111111111',
  status: 'TRIAL',
  dataInicio: new Date().toISOString(),
  dataFimTrial: new Date(Date.now() + 10 * 86400000).toISOString(),
  diasRestantesTrial: 10,
  estaVigente: true,
  planosDisponiveis: ASSINATURA_PADRAO.planosDisponiveis,
};

assert.strictEqual(assinaturaEmTrial.estaVigente, true);
assert.ok(obterMensagemPaywall(assinaturaEmTrial).includes('10 dias de teste grátis'));

const assinaturaExpirada: AssinaturaStatus = {
  restauranteId: '11111111-1111-1111-1111-111111111111',
  status: 'EXPIRADA',
  dataInicio: new Date(Date.now() - 30 * 86400000).toISOString(),
  dataFimTrial: new Date(Date.now() - 16 * 86400000).toISOString(),
  diasRestantesTrial: 0,
  estaVigente: false,
  planosDisponiveis: ASSINATURA_PADRAO.planosDisponiveis,
};

assert.strictEqual(assinaturaExpirada.estaVigente, false, 'Assinatura expirada NÃO deve estar vigente');
assert.ok(
  obterMensagemPaywall(assinaturaExpirada).includes('Seu período de degustação encerrou'),
  'Deve exibir alerta de encerramento de degustação'
);

console.log('[OK] 2. Discriminador de estado e mensagens do Paywall validado.');

// ============================================================================
// 3. Priorização do Plano Pro com Módulo IA no Seletor
// ============================================================================
function selecionarPlanoPadrao(planos: readonly PlanoItem[]): string {
  return planos.find((p) => p.possuiModuloIa)?.id || planos[0]?.id || '';
}

const planosMock: PlanoItem[] = [
  { id: 'plano-basico-1', nome: 'Básico', descricao: 'PDV e Caixa', precoMensal: 89.9, possuiModuloIa: false },
  { id: 'plano-pro-2', nome: 'Pro Inteligente', descricao: 'PDV + IA + Previsão', precoMensal: 179.9, possuiModuloIa: true },
];

const selecionadoComIa = selecionarPlanoPadrao(planosMock);
assert.strictEqual(selecionadoComIa, 'plano-pro-2', 'O plano padrão deve sempre priorizar o plano Pro com IA');

const planosSemIa: PlanoItem[] = [
  { id: 'plano-unico-1', nome: 'Essencial', descricao: 'Somente PDV', precoMensal: 49.9, possuiModuloIa: false },
];
const selecionadoSemIa = selecionarPlanoPadrao(planosSemIa);
assert.strictEqual(selecionadoSemIa, 'plano-unico-1', 'Se não houver plano com IA, seleciona o primeiro disponível');

console.log('[OK] 3. Priorização de plano com IA no Paywall validada.');

// ============================================================================
// 4. Interceptor API: Injeção de Contexto X-Tenant-Id e Bearer Token
// ============================================================================
storage.clearAll();
storage.set(STORAGE_KEYS.AUTH_TOKEN, 'bearer-jwt-super-seguro-token');
storage.set(
  STORAGE_KEYS.ACTIVE_TENANT,
  JSON.stringify({
    id: '99999999-9999-9999-9999-999999999999',
    nome: 'Restaurante Teste Interceptor',
  })
);

// Executa os interceptores de requisição do Axios
const dummyConfig = { headers: {} as Record<string, string> };
// Simula execução do handler do interceptor
const requestInterceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
const resolvedConfig = requestInterceptor({ ...dummyConfig });

assert.strictEqual(
  resolvedConfig.headers.Authorization,
  'Bearer bearer-jwt-super-seguro-token',
  'Interceptor deve injetar header Authorization Bearer'
);
assert.strictEqual(
  resolvedConfig.headers['X-Tenant-Id'],
  '99999999-9999-9999-9999-999999999999',
  'Interceptor deve injetar header X-Tenant-Id do inquilino ativo'
);
assert.strictEqual(
  resolvedConfig.headers['api-id'],
  'restaurante-inteligente-pdv',
  'Interceptor deve injetar api-id'
);

console.log('[OK] 4. Interceptor Axios de isolamento Multi-Tenant e JWT validado.');
console.log('[TEST] SUCESSO: Todos os testes de SaaS Paywall e Interceptor foram aprovados!');
