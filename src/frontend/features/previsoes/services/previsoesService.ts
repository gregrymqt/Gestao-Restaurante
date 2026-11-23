import { apiClient, extractErrorMessage, isCancel } from '@/services/api';
import {
  RelatorioCapacidadeProducao,
  FichaTecnicaIngrediente,
} from '../types';
import {
  obterPrecoVendaProduto,
  calcularPerdaEstimada,
} from '../utils/previsoesHelpers';
import {
  DADOS_PREVISAO_PADRAO,
  gerarProjecaoFallbackParaData,
} from './previsoesMockData';

export { DADOS_PREVISAO_PADRAO };

export const previsoesService = {
  async obterCapacidadeProducao(
    dataAlvo?: string,
    signal?: AbortSignal
  ): Promise<RelatorioCapacidadeProducao> {
    try {
      const response = await apiClient.get<RelatorioCapacidadeProducao>('/previsoes/capacidade', {
        params: dataAlvo ? { dataAlvo } : undefined,
        signal,
      });

      if (
        response.data &&
        Array.isArray(response.data.itensCapacidade) &&
        response.data.itensCapacidade.length > 0
      ) {
        const itensEnriquecidos = response.data.itensCapacidade.map((item) => {
          const preco = obterPrecoVendaProduto(item);
          const perda = calcularPerdaEstimada({ ...item, precoVendaUnitario: preco });
          return {
            ...item,
            precoVendaUnitario: preco,
            perdaEstimadaReceita: perda,
          };
        });

        return {
          ...response.data,
          itensCapacidade: itensEnriquecidos,
          contextoClimatico:
            response.data.contextoClimatico || DADOS_PREVISAO_PADRAO.contextoClimatico,
        };
      }

      return gerarProjecaoFallbackParaData(dataAlvo);
    } catch (e: unknown) {
      if (isCancel(e)) throw e;
      return gerarProjecaoFallbackParaData(dataAlvo);
    }
  },

  async obterFichaTecnica(
    produtoId: string,
    nomeProduto?: string,
    signal?: AbortSignal
  ): Promise<FichaTecnicaIngrediente[]> {
    try {
      const response = await apiClient.get<Array<{
        id: string;
        nome: string;
        ingredientes: Array<{ insumoId: string; nome: string; quantidade: string }>;
        custoInsumos: number;
        capacidadeTurnoPorcoes: number;
      }>>('/estoque/fichas-tecnicas', { signal });

      if (Array.isArray(response.data)) {
        const fichaEncontrada = response.data.find(
          (f: { id: string; nome: string; [key: string]: unknown }) =>
            f.id === produtoId ||
            (f as { produtoId?: string }).produtoId === produtoId ||
            (nomeProduto && f.nome && f.nome.trim().toLowerCase() === nomeProduto.trim().toLowerCase()) ||
            (nomeProduto && f.nome && (f.nome.toLowerCase().includes(nomeProduto.toLowerCase()) || nomeProduto.toLowerCase().includes(f.nome.toLowerCase())))
        );

        if (fichaEncontrada && Array.isArray(fichaEncontrada.ingredientes)) {
          return fichaEncontrada.ingredientes.map((ing) => {
            const partes = (ing.quantidade || '').trim().split(' ');
            const qtdNum = parseFloat(partes[0]) || 1;
            const unidade = partes.length > 1 ? partes[1] : 'un';

            return {
              insumoId: ing.insumoId,
              nomeInsumo: ing.nome,
              quantidadePorPorcao: qtdNum,
              unidadeMedida: unidade,
              estoqueAtual: 0,
              estoqueNecessario: qtdNum,
              capacidadeMaxItem: fichaEncontrada.capacidadeTurnoPorcoes || 0,
              isGargalo: false,
            };
          });
        }
      }
    } catch (e: unknown) {
      if (isCancel(e)) throw e;
      // Fallback gracioso para dados locais caso backend offline
    }

    return [];
  },

  async enviarOrdemCompra(
    pedido: {
      insumos: Array<{ insumoId: string; nomeInsumo: string; quantidade: number; unidadeMedida?: string }>;
      valorTotal: number;
    },
    signal?: AbortSignal
  ): Promise<{ sucesso: boolean; protocolo: string }> {
    try {
      const response = await apiClient.post<{
        id: string;
        protocolo: string;
        status: string;
        valorTotal: number;
        criadoEm: string;
        sucesso?: boolean;
      }>(
        '/previsoes/ordens-compra',
        {
          insumos: pedido.insumos.map((i) => ({
            insumoId: i.insumoId,
            nomeInsumo: i.nomeInsumo,
            quantidade: i.quantidade,
            unidadeMedida: i.unidadeMedida,
          })),
          valorTotal: pedido.valorTotal,
        },
        { signal }
      );

      return {
        sucesso: response.data.sucesso ?? true,
        protocolo: response.data.protocolo,
      };
    } catch (err: unknown) {
      if (isCancel(err)) throw err;
      throw new Error(extractErrorMessage(err, 'Não foi possível emitir a ordem de compra.'));
    }
  },
};
