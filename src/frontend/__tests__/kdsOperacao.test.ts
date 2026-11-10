import assert from 'node:assert';
import {
  calcularSlaTicket,
  obterEstiloModificadorKds,
  obterProximaAcaoKds,
  obterBadgeStatusPreparo,
} from '../features/kds/utils/kdsHelpers';

console.log('[TEST] Iniciando testes operacionais do KDS (SLA, Modificadores e Ciclo)...');

const agora = new Date('2026-11-10T12:00:00Z').getTime();

// 1. SLA Verde (< 10 min)
const slaVerde = calcularSlaTicket(new Date(agora - 4 * 60 * 1000 - 5 * 1000).toISOString(), agora);
assert.strictEqual(slaVerde.nivel, 'VERDE');
assert.strictEqual(slaVerde.atrasado, false);
assert.strictEqual(slaVerde.formatado, '04:05');
console.log('[OK] 1. SLA Verde (< 10 min) validado com timer 04:05');

// 2. SLA Amarelo (10 a 14 min)
const slaAmarelo = calcularSlaTicket(new Date(agora - 12 * 60 * 1000).toISOString(), agora);
assert.strictEqual(slaAmarelo.nivel, 'AMARELO');
assert.strictEqual(slaAmarelo.atrasado, false);
assert.strictEqual(slaAmarelo.formatado, '12:00');
console.log('[OK] 2. SLA Amarelo (10..14 min) validado');

// 3. SLA Vermelho (>= 15 min)
const slaVermelho = calcularSlaTicket(new Date(agora - 16 * 60 * 1000 - 30 * 1000).toISOString(), agora);
assert.strictEqual(slaVermelho.nivel, 'VERMELHO');
assert.strictEqual(slaVermelho.atrasado, true);
assert.strictEqual(slaVermelho.formatado, '16:30');
console.log('[OK] 3. SLA Vermelho (>= 15 min) e flag de atraso validados');

// 4. Classificação Visual de Modificadores (Remoção / Culinário / Adicional)
const estRemocao = obterEstiloModificadorKds('Remocao');
const estCulinario = obterEstiloModificadorKds('Culinario');
const estAdicional = obterEstiloModificadorKds('Adicional');
assert.strictEqual(estRemocao.icone.includes('🟥'), true);
assert.strictEqual(estCulinario.icone.includes('🟩'), true);
assert.strictEqual(estAdicional.icone.includes('🟦'), true);
console.log('[OK] 4. Código de cores dos modificadores KDS validado');

// 5. Pipeline de Transição de 3 Estágios (RECEBIDO -> EM_PREPARO -> PRONTO -> ENTREGUE)
const acao1 = obterProximaAcaoKds('RECEBIDO');
assert.strictEqual(acao1?.proximoStatus, 'EM_PREPARO');
const acao2 = obterProximaAcaoKds('EM_PREPARO');
assert.strictEqual(acao2?.proximoStatus, 'PRONTO');
const acao3 = obterProximaAcaoKds('PRONTO');
assert.strictEqual(acao3?.proximoStatus, 'ENTREGUE');
const acao4 = obterProximaAcaoKds('ENTREGUE');
assert.strictEqual(acao4, null);
console.log('[OK] 5. Pipeline RECEBIDO -> EM_PREPARO -> PRONTO -> ENTREGUE validado');

// 6. Badges de Status no Histórico do PDV
assert.strictEqual(obterBadgeStatusPreparo('EM_PREPARO').label.includes('Em Preparo'), true);
assert.strictEqual(obterBadgeStatusPreparo('PRONTO').label.includes('Pronto'), true);
console.log('[OK] 6. Badges operacionais de histórico validados');

console.log('======================================================');
console.log('✅ TODOS OS TESTES OPERACIONAIS DO KDS PASSARAM!');
console.log('======================================================');
