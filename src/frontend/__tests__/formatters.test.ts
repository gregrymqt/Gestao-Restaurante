import assert from 'node:assert';
import {
  formatarQuantidade,
  formatarMoeda,
  formatarMoedaInput,
  formatarPorcaoGastronomica,
} from '../shared/utils/formatters';

console.log('[TEST] Iniciando testes discriminatórios de formatters e conversões de dados...');

// ============================================================================
// 1. formatarQuantidade
// ============================================================================
// Unidades inteiras devem ser arredondadas sem casas decimais
assert.strictEqual(formatarQuantidade(5.4, 'un'), '5 un');
assert.strictEqual(formatarQuantidade(12.8, 'cx'), '13 cx');
assert.strictEqual(formatarQuantidade(3.0, 'pct'), '3 pct');
assert.strictEqual(formatarQuantidade(10.1, 'lata'), '10 lata');
assert.strictEqual(formatarQuantidade(6.9, 'garrafa'), '7 garrafa');

// Unidades fracionárias devem preservar decimais com vírgula pt-BR
const kgFormatado = formatarQuantidade(3.25, 'kg');
assert.ok(kgFormatado === '3,25 kg' || kgFormatado === '3.25 kg', `kg formatado inesperado: ${kgFormatado}`);

const gFormatado = formatarQuantidade(250.5, 'g');
assert.ok(gFormatado === '250,5 g' || gFormatado === '250.5 g', `g formatado inesperado: ${gFormatado}`);

// Resiliência a NaN / valores inválidos
assert.strictEqual(formatarQuantidade(Number.NaN, 'un'), '0 un');
assert.strictEqual(formatarQuantidade(Number.NaN, ''), '0');

console.log('[OK] 1. formatarQuantidade validado com sucesso.');

// ============================================================================
// 2. formatarMoeda
// ============================================================================
const dezReais = formatarMoeda(10.5);
// Deve conter '10,50' e 'R$' (suporta espaços normais e non-breaking spaces \u00A0 de Intl)
assert.ok(dezReais.includes('10,50') || dezReais.includes('10.50'), `Valor monetário inesperado: ${dezReais}`);
assert.ok(dezReais.includes('R$'), `Prefixo monetário R$ ausente: ${dezReais}`);

const zeroReais = formatarMoeda(0);
assert.ok(zeroReais.includes('0,00') || zeroReais.includes('0.00'), `Zero monetário inesperado: ${zeroReais}`);

const nanReais = formatarMoeda(Number.NaN);
assert.strictEqual(nanReais, 'R$ 0,00', 'NaN deve retornar R$ 0,00');

console.log('[OK] 2. formatarMoeda validado com sucesso.');

// ============================================================================
// 3. formatarMoedaInput
// ============================================================================
// Digitação contínua de centavos para moeda pt-BR
assert.strictEqual(formatarMoedaInput('250'), '2,50');
assert.strictEqual(formatarMoedaInput('100050'), '1.000,50');
assert.strictEqual(formatarMoedaInput('5'), '0,05');
assert.strictEqual(formatarMoedaInput('05'), '0,05');
assert.strictEqual(formatarMoedaInput(''), '');
assert.strictEqual(formatarMoedaInput('abc-xyz!'), '', 'Strings sem dígitos devem retornar vazio');

console.log('[OK] 3. formatarMoedaInput validado com sucesso.');

// ============================================================================
// 4. formatarPorcaoGastronomica
// ============================================================================
// Conversão inteligente de frações culinárias:
// - kg < 1 deve converter para gramas ('g')
assert.strictEqual(formatarPorcaoGastronomica(0.18, 'kg'), '180 g');
assert.strictEqual(formatarPorcaoGastronomica(0.04, 'kg'), '40 g');
assert.strictEqual(formatarPorcaoGastronomica(0.005, 'kg'), '5 g');

// - kg >= 1 deve permanecer em kg
const umKiloMeio = formatarPorcaoGastronomica(1.5, 'kg');
assert.ok(umKiloMeio === '1,5 kg' || umKiloMeio === '1.5 kg', `1.5 kg inesperado: ${umKiloMeio}`);

// - L < 1 deve converter para mililitros ('ml')
assert.strictEqual(formatarPorcaoGastronomica(0.2, 'l'), '200 ml');
assert.strictEqual(formatarPorcaoGastronomica(0.05, 'L'), '50 ml');

// - L >= 1 deve permanecer em L
const doisLitros = formatarPorcaoGastronomica(2, 'L');
assert.ok(doisLitros === '2 L' || doisLitros === '2 l', `2 L inesperado: ${doisLitros}`);

// - Unidades inteiras permanecem inteiras
assert.strictEqual(formatarPorcaoGastronomica(1, 'un'), '1 un');
assert.strictEqual(formatarPorcaoGastronomica(2, 'fatias'), '2 fatias');

console.log('[OK] 4. formatarPorcaoGastronomica validado com sucesso.');
console.log('[TEST] SUCESSO: Todos os testes de formatters foram aprovados!');
