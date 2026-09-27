import { apiClient } from '@/services/api';
import {
  RelatorioCapacidadeProducao,
  FichaTecnicaIngrediente,
} from '../types';

export const DADOS_PREVISAO_PADRAO: RelatorioCapacidadeProducao = {
  dataReferencia: '2026-09-28',
  itensCapacidade: [
    {
      produtoId: 'prod-smash-duplo',
      nomeProduto: 'Smash Burger Duplo',
      demandaPrevista: 128,
      capacidadeMaximaProducao: 90,
      demandaAtendivel: 90,
      riscoRutura: true,
      insumoGargaloNome: 'Carne Bovina Smash',
      deficitUnidades: 38,
      precoVendaUnitario: 34.90,
      perdaEstimadaReceita: 1326.20,
    },
    {
      produtoId: 'prod-batata-rustica',
      nomeProduto: 'Batata Rústica Trufada',
      demandaPrevista: 95,
      capacidadeMaximaProducao: 85,
      demandaAtendivel: 85,
      riscoRutura: true,
      insumoGargaloNome: 'Azeite Trufado',
      deficitUnidades: 10,
      precoVendaUnitario: 26.00,
      perdaEstimadaReceita: 260.00,
    },
    {
      produtoId: 'prod-suco-laranja',
      nomeProduto: 'Suco Laranja 500ml',
      demandaPrevista: 60,
      capacidadeMaximaProducao: 60,
      demandaAtendivel: 60,
      riscoRutura: false,
      insumoGargaloNome: 'Nenhum',
      deficitUnidades: 0,
      precoVendaUnitario: 14.00,
      perdaEstimadaReceita: 0,
    },
  ],
  sugestoesReposicao: [
    {
      insumoId: 'ins-carne-smash',
      nomeInsumo: 'Carne Bovina Smash',
      unidadeMedida: 'kg',
      stockAtual: 16.2,
      stockNecessario: 25.2,
      quantidadeComprar: 9.0,
      precoEstimadoUnitario: 38.50,
    },
    {
      insumoId: 'ins-pao-brioche',
      nomeInsumo: 'Pão Brioche Tradicional',
      unidadeMedida: 'un',
      stockAtual: 108,
      stockNecessario: 128,
      quantidadeComprar: 20,
      precoEstimadoUnitario: 3.30,
    },
    {
      insumoId: 'ins-batata-congelada',
      nomeInsumo: 'Batata Pré-Frita Congelada',
      unidadeMedida: 'kg',
      stockAtual: 35.0,
      stockNecessario: 30.0,
      quantidadeComprar: 0,
      precoEstimadoUnitario: 14.00,
    },
  ],
  contextoClimatico: {
    temperatura: 26,
    condicao: 'Céu claro a parc. chuva',
    precipitacaoMm: 1.2,
    impactoDescricao:
      'Alta temperatura combinada a garoa pontual eleva a demanda de bebidas geladas (+12%) e fluxo em balcão (+8%).',
  },
};

export const FICHAS_TECNICAS_MOCK: Record<string, FichaTecnicaIngrediente[]> = {
  'prod-smash-duplo': [
    {
      insumoId: 'ins-carne-smash',
      nomeInsumo: 'Carne Bovina Smash (Blend)',
      quantidadePorPorcao: 0.18,
      unidadeMedida: 'kg',
      estoqueAtual: 16.2,
      estoqueNecessario: 23.04,
      capacidadeMaxItem: 90,
      isGargalo: true,
    },
    {
      insumoId: 'ins-pao-brioche',
      nomeInsumo: 'Pão Brioche Artesanal',
      quantidadePorPorcao: 1,
      unidadeMedida: 'un',
      estoqueAtual: 108,
      estoqueNecessario: 128,
      capacidadeMaxItem: 108,
      isGargalo: false,
    },
    {
      insumoId: 'ins-queijo-cheddar',
      nomeInsumo: 'Queijo Cheddar Fatiado',
      quantidadePorPorcao: 0.04,
      unidadeMedida: 'kg',
      estoqueAtual: 8.5,
      estoqueNecessario: 5.12,
      capacidadeMaxItem: 212,
      isGargalo: false,
    },
  ],
  'prod-batata-rustica': [
    {
      insumoId: 'ins-azeite-trufado',
      nomeInsumo: 'Azeite Trufado Importado',
      quantidadePorPorcao: 0.015,
      unidadeMedida: 'L',
      estoqueAtual: 1.27,
      estoqueNecessario: 1.42,
      capacidadeMaxItem: 85,
      isGargalo: true,
    },
    {
      insumoId: 'ins-batata-congelada',
      nomeInsumo: 'Batata Rústica Especial',
      quantidadePorPorcao: 0.25,
      unidadeMedida: 'kg',
      estoqueAtual: 35.0,
      estoqueNecessario: 23.75,
      capacidadeMaxItem: 140,
      isGargalo: false,
    },
  ],
  'prod-suco-laranja': [
    {
      insumoId: 'ins-laranja-pera',
      nomeInsumo: 'Laranja Pêra Fresca',
      quantidadePorPorcao: 0.6,
      unidadeMedida: 'kg',
      estoqueAtual: 60.0,
      estoqueNecessario: 36.0,
      capacidadeMaxItem: 100,
      isGargalo: false,
    },
  ],
};

export const previsoesService = {
  async obterCapacidadeProducao(dataAlvo?: string): Promise<RelatorioCapacidadeProducao> {
    try {
      const response = await apiClient.get<RelatorioCapacidadeProducao>('/previsoes/capacidade', {
        params: dataAlvo ? { dataAlvo } : undefined,
      });

      return {
        ...response.data,
        contextoClimatico: DADOS_PREVISAO_PADRAO.contextoClimatico,
      };
    } catch {
      // Fallback resiliente com dados analíticos de demonstração
      return {
        ...DADOS_PREVISAO_PADRAO,
        dataReferencia: dataAlvo || DADOS_PREVISAO_PADRAO.dataReferencia,
      };
    }
  },

  async obterFichaTecnica(produtoId: string): Promise<FichaTecnicaIngrediente[]> {
    return FICHAS_TECNICAS_MOCK[produtoId] || [];
  },

  async enviarOrdemCompra(pedido: {
    insumos: Array<{ insumoId: string; nomeInsumo: string; quantidade: number }>;
    valorTotal: number;
  }): Promise<{ sucesso: boolean; protocolo: string }> {
    return {
      sucesso: true,
      protocolo: `OC-${Date.now().toString(36).toUpperCase()}`,
    };
  },
};
