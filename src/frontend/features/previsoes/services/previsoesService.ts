import { apiClient } from '@/services/api';
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
  FICHAS_TECNICAS_MOCK,
  normalizarTexto,
  gerarProjecaoFallbackParaData,
} from './previsoesMockData';

export { DADOS_PREVISAO_PADRAO, FICHAS_TECNICAS_MOCK };

export const previsoesService = {
  async obterCapacidadeProducao(dataAlvo?: string): Promise<RelatorioCapacidadeProducao> {
    try {
      const response = await apiClient.get<RelatorioCapacidadeProducao>('/previsoes/capacidade', {
        params: dataAlvo ? { dataAlvo } : undefined,
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
    } catch {
      return gerarProjecaoFallbackParaData(dataAlvo);
    }
  },

  async obterFichaTecnica(
    produtoId: string,
    nomeProduto?: string
  ): Promise<FichaTecnicaIngrediente[]> {
    if (FICHAS_TECNICAS_MOCK[produtoId]) {
      return FICHAS_TECNICAS_MOCK[produtoId];
    }

    const nomeNorm = normalizarTexto(nomeProduto || '');
    if (nomeNorm.includes('brownie')) return FICHAS_TECNICAS_MOCK['prod-brownie-sorvete'];
    if (nomeNorm.includes('smash') && nomeNorm.includes('bacon'))
      return FICHAS_TECNICAS_MOCK['prod-smash-bacon'];
    if (nomeNorm.includes('smash')) return FICHAS_TECNICAS_MOCK['prod-smash-duplo'];
    if (nomeNorm.includes('batata')) return FICHAS_TECNICAS_MOCK['prod-batata-rustica'];
    if (nomeNorm.includes('suco') || nomeNorm.includes('laranja'))
      return FICHAS_TECNICAS_MOCK['prod-suco-laranja'];
    if (nomeNorm.includes('refrigerante')) return FICHAS_TECNICAS_MOCK['prod-refrigerante'];
    if (nomeNorm.includes('pudim')) return FICHAS_TECNICAS_MOCK['prod-pudim'];
    if (nomeNorm.includes('cheese')) return FICHAS_TECNICAS_MOCK['prod-cheeseburger'];

    return [];
  },

  async enviarOrdemCompra(pedido: {
    insumos: Array<{ insumoId: string; nomeInsumo: string; quantidade: number; unidadeMedida?: string }>;
    valorTotal: number;
  }): Promise<{ sucesso: boolean; protocolo: string }> {
    return {
      sucesso: true,
      protocolo: `OC-${Date.now().toString(36).toUpperCase()}`,
    };
  },
};
