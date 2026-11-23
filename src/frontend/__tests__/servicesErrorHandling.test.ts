import test from 'node:test';
import assert from 'node:assert';

process.env.EXPO_PUBLIC_API_URL = 'http://localhost:5000/api/v1';

import { apiClient, extractErrorMessage, isCancel } from '../shared/services/api';
import { useConnectionStore } from '../shared/hooks/useConnectionStore';
import { adminService } from '../features/admin/services/adminService';
import { assinaturaService } from '../features/assinatura/services/assinaturaService';
import { caixaService } from '../features/caixa/services/caixaService';
import { dashboardService } from '../features/dashboard/services/dashboardService';
import { estoqueService } from '../features/estoque/services/estoqueService';
import { kdsService } from '../features/kds/services/kdsService';
import { perfilService } from '../features/perfil/services/perfilService';
import { previsoesService } from '../features/previsoes/services/previsoesService';
import { vendasService } from '../features/vendas/services/vendasService';

test('Tratamento de Erros e extractErrorMessage no Frontend', async (t) => {
  await t.test('extractErrorMessage deve cobrir todos os contratos de erro da API e fallback', () => {
    // 1. Mensagem via campo error
    const errError = { response: { data: { error: 'Saldo insuficiente na gaveta.' } } };
    assert.strictEqual(extractErrorMessage(errError, 'Fallback'), 'Saldo insuficiente na gaveta.');

    // 2. Mensagem via RFC 7807 detail
    const errDetail = { response: { data: { detail: 'Insumo não encontrado no estoque.' } } };
    assert.strictEqual(extractErrorMessage(errDetail, 'Fallback'), 'Insumo não encontrado no estoque.');

    // 3. Mensagem via RFC 7807 title
    const errTitle = { response: { data: { title: 'Conflito de concorrência ao fechar caixa.' } } };
    assert.strictEqual(extractErrorMessage(errTitle, 'Fallback'), 'Conflito de concorrência ao fechar caixa.');

    // 4. Exceção nativa de rede ou runtime
    const errNative = new Error('Network timeout após 10000ms');
    assert.strictEqual(extractErrorMessage(errNative, 'Fallback'), 'Network timeout após 10000ms');

    // 5. Fallback gracioso para tipos primitivos ou inesperados
    assert.strictEqual(extractErrorMessage('string direta', 'Fallback'), 'Fallback');
    assert.strictEqual(extractErrorMessage(null, 'Fallback'), 'Fallback');
    assert.strictEqual(extractErrorMessage(undefined, 'Fallback'), 'Fallback');
    assert.strictEqual(extractErrorMessage({}, 'Fallback'), 'Fallback');
    assert.strictEqual(extractErrorMessage({ response: {} }, 'Fallback'), 'Fallback');

    // 6. Requisições canceladas intencionalmente não devem gerar mensagem de erro na UI
    const errCanceled = { code: 'ERR_CANCELED', message: 'canceled' };
    assert.strictEqual(extractErrorMessage(errCanceled, 'Fallback'), '');
    const nativeCancel = new Error('canceled');
    (nativeCancel as any).name = 'CanceledError';
    assert.strictEqual(extractErrorMessage(nativeCancel, 'Fallback'), '');
  });

  await t.test('Todas as Feature Services devem expor métodos de mutação tipados', () => {
    assert.strictEqual(typeof adminService.estenderTrial, 'function');
    assert.strictEqual(typeof adminService.alterarStatus, 'function');
    assert.strictEqual(typeof assinaturaService.assinarPlano, 'function');
    assert.strictEqual(typeof caixaService.abrirCaixa, 'function');
    assert.strictEqual(typeof caixaService.fecharCaixa, 'function');
    assert.strictEqual(typeof dashboardService.obterResumoExecutivo, 'function');
    assert.strictEqual(typeof estoqueService.registrarEntradaEstoque, 'function');
    assert.strictEqual(typeof estoqueService.cadastrarInsumo, 'function');
    assert.strictEqual(typeof estoqueService.registrarBaixaEstoque, 'function');
    assert.strictEqual(typeof kdsService.atualizarStatusPedido, 'function');
    assert.strictEqual(typeof perfilService.registrarMovimentacao, 'function');
    assert.strictEqual(typeof previsoesService.enviarOrdemCompra, 'function');
    assert.strictEqual(typeof previsoesService.listarOrdensCompra, 'function');
    assert.strictEqual(typeof previsoesService.atualizarStatusOrdemCompra, 'function');
    assert.strictEqual(typeof previsoesService.receberOrdemCompra, 'function');
    assert.strictEqual(typeof vendasService.registrarVenda, 'function');
    assert.strictEqual(typeof vendasService.criarProduto, 'function');
  });

  await t.test('Services devem lançar Error com a mensagem extraída em caso de rejeição HTTP', async () => {
    const originalPost = apiClient.post;
    const originalPatch = apiClient.patch;

    try {
      // Mock de falha com res.data.error
      apiClient.post = async () => {
        return Promise.reject({
          response: { data: { error: 'Operação recusada pelo servidor.' } },
        });
      };

      await assert.rejects(
        () => adminService.estenderTrial('test-id', 7),
        (err: Error) => {
          assert.strictEqual(err.message, 'Operação recusada pelo servidor.');
          return true;
        }
      );

      await assert.rejects(
        () => assinaturaService.assinarPlano('plano-pro'),
        (err: Error) => {
          assert.strictEqual(err.message, 'Operação recusada pelo servidor.');
          return true;
        }
      );

      await assert.rejects(
        () => caixaService.abrirCaixa(),
        (err: Error) => {
          assert.strictEqual(err.message, 'Operação recusada pelo servidor.');
          return true;
        }
      );

      await assert.rejects(
        () => caixaService.fecharCaixa(),
        (err: Error) => {
          assert.strictEqual(err.message, 'Operação recusada pelo servidor.');
          return true;
        }
      );

      await assert.rejects(
        () => vendasService.registrarVenda({} as any),
        (err: Error) => {
          assert.strictEqual(err.message, 'Operação recusada pelo servidor.');
          return true;
        }
      );

      await assert.rejects(
        () => estoqueService.cadastrarInsumo({} as any),
        (err: Error) => {
          assert.strictEqual(err.message, 'Operação recusada pelo servidor.');
          return true;
        }
      );

      // Mock de falha PATCH no KDS
      apiClient.patch = async () => {
        return Promise.reject({
          response: { data: { detail: 'Pedido KDS inexistente.' } },
        });
      };

      await assert.rejects(
        () => kdsService.atualizarStatusPedido('venda-1', 'PRONTO'),
        (err: Error) => {
          assert.strictEqual(err.message, 'Pedido KDS inexistente.');
          return true;
        }
      );

      // Mock de falha genérica de rede com fallback amigável
      apiClient.post = async () => {
        return Promise.reject('falha de rede sem resposta estruturada');
      };

      await assert.rejects(
        () => estoqueService.registrarEntradaEstoque({} as any),
        (err: Error) => {
          assert.strictEqual(err.message, 'Não foi possível registrar entrada no estoque.');
          return true;
        }
      );

      await assert.rejects(
        () => previsoesService.enviarOrdemCompra({ insumos: [], valorTotal: 0 }),
        (err: Error) => {
          assert.strictEqual(err.message, 'Não foi possível emitir a ordem de compra.');
          return true;
        }
      );
    } finally {
      apiClient.post = originalPost;
      apiClient.patch = originalPatch;
    }
  });

  await t.test('Interceptor de rede deve ignorar cancelamentos sem marcar a API como offline', async () => {
    // Garante que o estado inicial está online
    useConnectionStore.getState().setApiOnline(true);
    assert.strictEqual(useConnectionStore.getState().isApiOnline, true);

    const controller = new AbortController();
    controller.abort();

    try {
      await apiClient.get('/test-abort', { signal: controller.signal });
      assert.fail('Deveria ter rejeitado por cancelamento');
    } catch (err: unknown) {
      assert.strictEqual(isCancel(err), true);
      // Confirma que a API continua marcada como ONLINE
      assert.strictEqual(useConnectionStore.getState().isApiOnline, true);
    }
  });

  await t.test('Feature Services devem relançar CanceledError sem acionar fallbacks de mock', async () => {
    const controller = new AbortController();
    controller.abort();

    // 1. Admin Service
    await assert.rejects(
      () => adminService.listarTenants(undefined, controller.signal),
      (err: unknown) => isCancel(err)
    );

    // 2. Assinatura Service
    await assert.rejects(
      () => assinaturaService.obterStatus(controller.signal),
      (err: unknown) => isCancel(err)
    );

    // 3. Estoque Service
    await assert.rejects(
      () => estoqueService.obterInsumos(controller.signal),
      (err: unknown) => isCancel(err)
    );

    // 4. Dashboard Service
    await assert.rejects(
      () => dashboardService.obterResumoExecutivo(controller.signal),
      (err: unknown) => isCancel(err)
    );

    // 5. Previsões Service
    await assert.rejects(
      () => previsoesService.obterCapacidadeProducao(undefined, controller.signal),
      (err: unknown) => isCancel(err)
    );

    // 6. Vendas Service
    await assert.rejects(
      () => vendasService.obterProdutos(controller.signal),
      (err: unknown) => isCancel(err)
    );
  });

  await t.test('Mutações nos Feature Services devem suportar AbortSignal e rejeitar por cancelamento', async () => {
    const controller = new AbortController();
    controller.abort();

    await assert.rejects(
      () => vendasService.registrarVenda({} as any, controller.signal),
      (err: unknown) => isCancel(err)
    );

    await assert.rejects(
      () => caixaService.abrirCaixa(controller.signal),
      (err: unknown) => isCancel(err)
    );

    await assert.rejects(
      () => caixaService.fecharCaixa(controller.signal),
      (err: unknown) => isCancel(err)
    );

    await assert.rejects(
      () => estoqueService.cadastrarInsumo({} as any, controller.signal),
      (err: unknown) => isCancel(err)
    );

    await assert.rejects(
      () =>
        perfilService.registrarMovimentacao(
          { tipo: 'SUPRIMENTO', valor: 50, motivo: 'Troco de teste' },
          100,
          controller.signal
        ),
      (err: unknown) => isCancel(err)
    );
  });
});
