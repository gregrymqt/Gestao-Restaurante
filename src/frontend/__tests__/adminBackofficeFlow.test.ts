import test from 'node:test';
import assert from 'node:assert';

process.env.EXPO_PUBLIC_API_URL = 'http://localhost:5000/api/v1';
process.env.EXPO_PUBLIC_API_ID = 'restaurante-inteligente-pdv';

import { apiClient } from '../shared/services/api';
import { adminService, TENANTS_ADMIN_PADRAO } from '../features/admin/services/adminService';

test('Admin Backoffice Flow & Business Rules', async (t) => {
  const originalGet = apiClient.get;
  const originalPost = apiClient.post;

  // Mock imediato para evitar esperar timeout de rede em ambiente de teste unitário
  apiClient.get = async () => Promise.reject(new Error('Simulated offline network'));
  apiClient.post = async () => Promise.reject(new Error('Simulated offline network'));

  try {
    await t.test('Deve listar tenants com paginação e totalizadores corretos (fallback mock)', async () => {
      const resposta = await adminService.listarTenants();
      assert.ok(Array.isArray(resposta.itens), 'Itens deve ser uma lista');
      assert.strictEqual(resposta.paginaAtual, 1);
      assert.ok(resposta.totalItens >= 2, 'Deve conter pelo menos 2 inquilinos cadastrados');
      assert.ok(resposta.totalPaginas >= 1, 'Total de páginas deve ser pelo menos 1');
    });

    await t.test('Deve filtrar tenants por status (TRIAL, ATIVA, EXPIRADA)', async () => {
      const apenasTrials = await adminService.listarTenants({ status: 'TRIAL' });
      assert.ok(apenasTrials.itens.length > 0, 'Deve retornar tenants em trial');
      assert.ok(
        apenasTrials.itens.every((item) => item.statusAssinatura === 'TRIAL'),
        'Todos os itens devem ter status TRIAL'
      );

      const apenasAtivas = await adminService.listarTenants({ status: 'ATIVA' });
      assert.ok(apenasAtivas.itens.length > 0, 'Deve retornar tenants com assinatura ativa');
      assert.ok(
        apenasAtivas.itens.every((item) => item.statusAssinatura === 'ATIVA'),
        'Todos os itens devem ter status ATIVA'
      );
    });

    await t.test('Deve filtrar tenants por busca de texto (Nome, CNPJ, Gestor)', async () => {
      const buscaNome = await adminService.listarTenants({ busca: 'Burger Prime' });
      assert.strictEqual(buscaNome.itens.length, 1);
      assert.strictEqual(buscaNome.itens[0].nomeRestaurante, 'Burger Prime Jardins');

      const buscaCnpj = await adminService.listarTenants({ busca: '98.765.432' });
      assert.strictEqual(buscaCnpj.itens.length, 1);
      assert.strictEqual(buscaCnpj.itens[0].cnpj, '98.765.432/0001-10');

      const buscaInexistente = await adminService.listarTenants({ busca: 'Restaurante Inexistente XYZ' });
      assert.strictEqual(buscaInexistente.itens.length, 0);
      assert.strictEqual(buscaInexistente.totalItens, 0);
    });

    await t.test('Deve respeitar os limites de paginação (itensPorPagina)', async () => {
      const paginado = await adminService.listarTenants({ pagina: 1, itensPorPagina: 1 });
      assert.strictEqual(paginado.itens.length, 1);
      assert.strictEqual(paginado.paginaAtual, 1);
      assert.ok(paginado.totalPaginas >= 2, 'Com itensPorPagina=1 deve ter múltiplas páginas');
    });

    await t.test('Deve processar resposta paginada da API quando online', async () => {
      apiClient.get = async () =>
        Promise.resolve({
          data: {
            itens: [TENANTS_ADMIN_PADRAO[0]],
            totalItens: 1,
            paginaAtual: 1,
            totalPaginas: 1,
          },
        } as any);

      const respostaOnline = await adminService.listarTenants({ pagina: 1 });
      assert.strictEqual(respostaOnline.totalItens, 1);
      assert.strictEqual(respostaOnline.itens[0].nomeRestaurante, TENANTS_ADMIN_PADRAO[0].nomeRestaurante);
    });

    await t.test('Validação de métodos de extensão e alteração de status', () => {
      assert.strictEqual(typeof adminService.estenderTrial, 'function');
      assert.strictEqual(typeof adminService.alterarStatus, 'function');
    });
  } finally {
    apiClient.get = originalGet;
    apiClient.post = originalPost;
  }
});
