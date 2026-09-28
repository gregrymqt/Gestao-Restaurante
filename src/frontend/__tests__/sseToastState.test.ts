import assert from 'node:assert';
import { useSseStatus } from '../shared/hooks/useSseStatus';
import { EstoqueCriticoPayload, SseEventTypes } from '../shared/types/sse.types';

console.log('[TEST] Iniciando validação de transição de estado Zustand para EstoqueCrítico...');

// 1. Limpa estado inicial
useSseStatus.getState().clearToast();
assert.strictEqual(useSseStatus.getState().activeToast, null, 'O estado activeToast deve iniciar nulo');

// 2. Simula payload real emitido pelo backend no barramento SSE
const payloadCritico: EstoqueCriticoPayload = {
  insumoId: '22222222-2222-2222-2222-222222222222',
  nomeInsumo: 'Pão Brioche Artesanal',
  saldoAtual: 4,
  saldoMinimo: 5,
  unidadeMedida: 'UN',
};

// 3. Aplica lógica do handler de evento do useRealtimeEvents
const eventType = SseEventTypes.ESTOQUE_CRITICO;
if (eventType === SseEventTypes.ESTOQUE_CRITICO) {
  useSseStatus.getState().showToast({
    tipo: 'critico',
    titulo: 'Alerta de Estoque Crítico',
    mensagem: `${payloadCritico.nomeInsumo} atingiu ${payloadCritico.saldoAtual} ${payloadCritico.unidadeMedida} (mínimo: ${payloadCritico.saldoMinimo}).`,
    icone: '⚠️',
  });
}

// 4. Asserções do Toast
const toastAtivo = useSseStatus.getState().activeToast;
assert.ok(toastAtivo !== null, 'Um toast ativo deve ser registrado no Zustand');
assert.strictEqual(toastAtivo.tipo, 'critico', 'Tipo do toast deve ser critico');
assert.strictEqual(toastAtivo.titulo, 'Alerta de Estoque Crítico', 'Título deve coincidir com o padrão de estoque');
assert.strictEqual(toastAtivo.icone, '⚠️', 'Ícone deve ser de atenção');
assert.ok(
  toastAtivo.mensagem.includes('Pão Brioche Artesanal atingiu 4 UN (mínimo: 5)'),
  `Mensagem incorreta: ${toastAtivo.mensagem}`
);
assert.ok(toastAtivo.id.startsWith('toast-'), 'ID único do toast deve ser gerado');
assert.ok(!Number.isNaN(Date.parse(toastAtivo.dataHora)), 'Data/hora deve ser um ISO string válido');

// 5. Limpeza do Toast
useSseStatus.getState().clearToast();
assert.strictEqual(useSseStatus.getState().activeToast, null, 'clearToast deve redefinir activeToast para nulo');

console.log('[TEST] SUCESSO: Todas as asserções de estado Zustand para EstoqueCrítico passaram com êxito!');
