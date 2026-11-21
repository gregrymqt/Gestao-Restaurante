import assert from 'node:assert';

process.env.EXPO_PUBLIC_API_URL = 'http://localhost:5000/api/v1';
process.env.EXPO_PUBLIC_API_ID = 'restaurante-inteligente-pdv';

const { adminService } = require('../features/admin/services/adminService');

console.log('[TEST] Iniciando testes de fluxo e regras de negócio do Admin Backoffice...');

async function runTests() {
  // 1. Deve listar tenants com paginação e totalizadores corretos
  const resposta = await adminService.listarTenants();
  assert.ok(Array.isArray(resposta.itens), 'Itens deve ser uma lista');
  assert.strictEqual(resposta.paginaAtual, 1);
  assert.ok(resposta.totalItens >= 2, 'Deve conter pelo menos 2 inquilinos cadastrados');
  assert.ok(resposta.totalPaginas >= 1, 'Total de páginas deve ser pelo menos 1');
  console.log('[OK] 1. Listagem com paginação e totalizadores validada.');

  // 2. Deve filtrar tenants por status (TRIAL, ATIVA, EXPIRADA)
  const apenasTrials = await adminService.listarTenants({ status: 'TRIAL' });
  assert.ok(apenasTrials.itens.length > 0, 'Deve retornar tenants em trial');
  assert.ok(apenasTrials.itens.every((t: { statusAssinatura: string }) => t.statusAssinatura === 'TRIAL'), 'Todos os itens devem ter status TRIAL');

  const apenasAtivas = await adminService.listarTenants({ status: 'ATIVA' });
  assert.ok(apenasAtivas.itens.length > 0, 'Deve retornar tenants com assinatura ativa');
  assert.ok(apenasAtivas.itens.every((t: { statusAssinatura: string }) => t.statusAssinatura === 'ATIVA'), 'Todos os itens devem ter status ATIVA');
  console.log('[OK] 2. Filtros de status (TRIAL e ATIVA) validados.');

  // 3. Deve filtrar tenants por busca de texto (Nome, CNPJ, Gestor)
  const buscaNome = await adminService.listarTenants({ busca: 'Burger Prime' });
  assert.strictEqual(buscaNome.itens.length, 1);
  assert.strictEqual(buscaNome.itens[0].nomeRestaurante, 'Burger Prime Jardins');

  const buscaCnpj = await adminService.listarTenants({ busca: '98.765.432' });
  assert.strictEqual(buscaCnpj.itens.length, 1);
  assert.strictEqual(buscaCnpj.itens[0].cnpj, '98.765.432/0001-10');

  const buscaInexistente = await adminService.listarTenants({ busca: 'Restaurante Inexistente XYZ' });
  assert.strictEqual(buscaInexistente.itens.length, 0);
  assert.strictEqual(buscaInexistente.totalItens, 0);
  console.log('[OK] 3. Filtros de busca textual validados.');

  // 4. Deve respeitar os limites de paginação (itensPorPagina)
  const paginado = await adminService.listarTenants({ pagina: 1, itensPorPagina: 1 });
  assert.strictEqual(paginado.itens.length, 1);
  assert.strictEqual(paginado.paginaAtual, 1);
  assert.ok(paginado.totalPaginas >= 2, 'Com itensPorPagina=1 deve ter múltiplas páginas');
  console.log('[OK] 4. Limites de paginação validados.');

  // 5. Validação de métodos de extensão e alteração de status
  assert.strictEqual(typeof adminService.estenderTrial, 'function');
  assert.strictEqual(typeof adminService.alterarStatus, 'function');
  console.log('[OK] 5. Métodos de extensão e alteração de status validados.');

  console.log('[TEST] SUCESSO: Todos os testes do Admin Backoffice passaram com louvor!');
}

runTests().catch((err) => {
  console.error('[FAIL] Erro nos testes do Admin Backoffice:', err);
  process.exit(1);
});
