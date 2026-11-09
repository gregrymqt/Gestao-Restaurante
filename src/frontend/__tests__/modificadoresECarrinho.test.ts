import assert from 'node:assert';
import { useCarrinho } from '../features/vendas/hooks/useCarrinho';
import { Produto, ModificadorSelecionado, GrupoModificador } from '../features/vendas/types';

console.log('[TEST] Iniciando testes de Modificadores de Pedido e Hash de Carrinho...');

// 1. Limpa o carrinho
useCarrinho.getState().limparCarrinho();
assert.strictEqual(useCarrinho.getState().itens.length, 0);

const burger: Produto = {
  id: 'prod-burger-1',
  nome: 'Cheeseburger Clássico',
  preco: 32.0,
  categoria: 'Hambúrgueres',
  ativo: true,
};

const modPonto: ModificadorSelecionado = {
  opcaoId: 'op-ponto-ao-ponto',
  grupoId: 'grp-ponto',
  nome: 'Ao Ponto',
  precoAdicional: 0,
  tipoAcao: 'Culinario',
  quantidadeInsumo: 0,
};

const modSemCebola: ModificadorSelecionado = {
  opcaoId: 'op-obs-sem-cebola',
  grupoId: 'grp-obs',
  nome: 'Sem Cebola',
  precoAdicional: 0,
  tipoAcao: 'Remocao',
  quantidadeInsumo: 0,
};

const modBacon: ModificadorSelecionado = {
  opcaoId: 'op-adic-bacon',
  grupoId: 'grp-adic',
  nome: 'Bacon Extra (+R$ 4,50)',
  precoAdicional: 4.5,
  tipoAcao: 'Adicional',
  insumoId: 'ins-bacon-1',
  quantidadeInsumo: 0.04,
};

// ============================================================================
// Teste 1: Adicionar produto sem modificador (ex: Bebida ou simples)
// ============================================================================
useCarrinho.getState().adicionarItem(burger);
let state = useCarrinho.getState();
assert.strictEqual(state.itens.length, 1);
assert.strictEqual(state.itens[0].id, 'prod-burger-1');
assert.strictEqual(state.itens[0].quantidade, 1);
assert.strictEqual(state.itens[0].precoUnitarioEfetivo, 32.0);
assert.strictEqual(state.itens[0].subtotal, 32.0);
console.log('[OK] 1. Produto simples adicionado com sucesso');

// ============================================================================
// Teste 2: Adicionar produto com modificadores diferentes cria uma linha separada
// ============================================================================
useCarrinho.getState().adicionarItem(burger, [modPonto, modSemCebola, modBacon]);
state = useCarrinho.getState();
assert.strictEqual(state.itens.length, 2, 'Deve ter 2 linhas separadas no carrinho');
const itemComMods = state.itens[1];
assert.strictEqual(itemComMods.quantidade, 1);
assert.strictEqual(itemComMods.precoUnitarioEfetivo, 36.5); // 32.00 + 4.50
assert.strictEqual(itemComMods.subtotal, 36.5);
assert.strictEqual(itemComMods.modificadores.length, 3);
console.log('[OK] 2. Produto com modificadores agrupado em linha separada');

// ============================================================================
// Teste 3: Adicionar o mesmo hambúrguer com os mesmos modificadores (mesmo em ordem diferente)
// deve incrementar a quantidade na mesma linha
// ============================================================================
useCarrinho.getState().adicionarItem(burger, [modBacon, modSemCebola, modPonto]); // ordem trocada
state = useCarrinho.getState();
assert.strictEqual(state.itens.length, 2, 'Não deve criar 3ª linha');
assert.strictEqual(state.itens[1].quantidade, 2, 'Quantidade deve ter sido incrementada para 2');
assert.strictEqual(state.itens[1].subtotal, 73.0); // 36.50 * 2
console.log('[OK] 3. Hash determinístico agrupou modificadores com sucesso');

// ============================================================================
// Teste 4: Subtotais gerais
// ============================================================================
assert.strictEqual(useCarrinho.getState().obterTotalItens(), 3); // 1 simples + 2 com mods
assert.strictEqual(useCarrinho.getState().obterSubtotal(), 105.0); // 32.00 + 73.00
console.log('[OK] 4. Totais gerais do carrinho conferidos (R$ 105,00)');

// ============================================================================
// Teste 5: Validação de regras de GrupoModificador
// ============================================================================
const grupoObrigatorio: GrupoModificador = {
  id: 'grp-ponto',
  nome: 'Ponto da Carne',
  obrigatorio: true,
  minimoSelecoes: 1,
  maximoSelecoes: 1,
  opcoes: [
    { id: 'op-1', nome: 'Ao Ponto', precoAdicional: 0, quantidadeInsumo: 0, tipoAcao: 'Culinario' },
    { id: 'op-2', nome: 'Bem Passado', precoAdicional: 0, quantidadeInsumo: 0, tipoAcao: 'Culinario' },
  ],
};

function validarGrupo(grupo: GrupoModificador, selecionados: string[]): boolean {
  if (grupo.obrigatorio && selecionados.length < grupo.minimoSelecoes) return false;
  if (selecionados.length > grupo.maximoSelecoes) return false;
  return true;
}

assert.strictEqual(validarGrupo(grupoObrigatorio, []), false, 'Obrigatório sem seleção deve falhar');
assert.strictEqual(validarGrupo(grupoObrigatorio, ['op-1']), true, '1 seleção deve passar');
assert.strictEqual(validarGrupo(grupoObrigatorio, ['op-1', 'op-2']), false, '2 seleções excede o máximo de 1');
console.log('[OK] 5. Regras de validação de grupos conferidas');

console.log('\n======================================================');
console.log('✅ TODOS OS TESTES DE MODIFICADORES E CARRINHO PASSARAM!');
console.log('======================================================');
