import {
  RelatorioCapacidadeProducao,
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
      insumoGargaloId: 'ins-carne-smash',
      insumoGargaloNome: 'Carne Bovina Smash',
      deficitUnidades: 38,
      precoVendaUnitario: 34.9,
      perdaEstimadaReceita: 1326.2,
    },
    {
      produtoId: 'prod-batata-rustica',
      nomeProduto: 'Batata Rústica Trufada',
      demandaPrevista: 95,
      capacidadeMaximaProducao: 85,
      demandaAtendivel: 85,
      riscoRutura: true,
      insumoGargaloId: 'ins-azeite-trufado',
      insumoGargaloNome: 'Azeite Trufado',
      deficitUnidades: 10,
      precoVendaUnitario: 26.0,
      perdaEstimadaReceita: 260.0,
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
      precoVendaUnitario: 14.0,
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
      precoEstimadoUnitario: 38.5,
    },
    {
      insumoId: 'ins-pao-brioche',
      nomeInsumo: 'Pão Brioche Tradicional',
      unidadeMedida: 'un',
      stockAtual: 108,
      stockNecessario: 128,
      quantidadeComprar: 20,
      precoEstimadoUnitario: 3.3,
    },
    {
      insumoId: 'ins-batata-congelada',
      nomeInsumo: 'Batata Pré-Frita Congelada',
      unidadeMedida: 'kg',
      stockAtual: 35.0,
      stockNecessario: 30.0,
      quantidadeComprar: 0,
      precoEstimadoUnitario: 14.0,
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

export function normalizarTexto(texto: string): string {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function gerarProjecaoFallbackParaData(dataAlvo?: string): RelatorioCapacidadeProducao {
  const isD1 = !dataAlvo || dataAlvo.endsWith('22');
  return {
    dataReferencia: dataAlvo || '2026-11-22',
    itensCapacidade: [
      {
        produtoId: '55555555-5555-5555-5555-555555555552',
        nomeProduto: 'Double Smash Bacon',
        demandaPrevista: isD1 ? 42 : 28,
        capacidadeMaximaProducao: isD1 ? 41 : 46,
        demandaAtendivel: isD1 ? 41 : 28,
        riscoRutura: isD1,
        insumoGargaloId: isD1 ? '55555555-5555-5555-5555-555555555551' : undefined,
        insumoGargaloNome: isD1 ? 'Bacon em Fatias Defumado' : 'Nenhum',
        deficitUnidades: isD1 ? 1 : 0,
        precoVendaUnitario: 41.0,
        perdaEstimadaReceita: isD1 ? 41.0 : 0,
      },
      {
        produtoId: 'prod-batata-rustica',
        nomeProduto: 'Batata Rústica Trufada',
        demandaPrevista: isD1 ? 35 : 20,
        capacidadeMaximaProducao: 51,
        demandaAtendivel: isD1 ? 35 : 20,
        riscoRutura: false,
        insumoGargaloNome: 'Nenhum',
        deficitUnidades: 0,
        precoVendaUnitario: 24.0,
        perdaEstimadaReceita: 0,
      },
      {
        produtoId: 'prod-refrigerante',
        nomeProduto: 'Refrigerante Lata 350ml',
        demandaPrevista: 0,
        capacidadeMaximaProducao: 96,
        demandaAtendivel: 0,
        riscoRutura: false,
        insumoGargaloNome: 'Nenhum',
        deficitUnidades: 0,
        precoVendaUnitario: 7.0,
        perdaEstimadaReceita: 0,
      },
      {
        produtoId: 'prod-suco-laranja',
        nomeProduto: 'Suco de Laranja Natural',
        demandaPrevista: 0,
        capacidadeMaximaProducao: 60,
        demandaAtendivel: 0,
        riscoRutura: false,
        insumoGargaloNome: 'Nenhum',
        deficitUnidades: 0,
        precoVendaUnitario: 12.0,
        perdaEstimadaReceita: 0,
      },
      {
        produtoId: 'prod-brownie-sorvete',
        nomeProduto: 'Brownie com Sorvete',
        demandaPrevista: 0,
        capacidadeMaximaProducao: 82,
        demandaAtendivel: 0,
        riscoRutura: false,
        insumoGargaloNome: 'Nenhum',
        deficitUnidades: 0,
        precoVendaUnitario: 18.9,
        perdaEstimadaReceita: 0,
      },
      {
        produtoId: 'prod-pudim',
        nomeProduto: 'Pudim de Leite Tradicional',
        demandaPrevista: 0,
        capacidadeMaximaProducao: 80,
        demandaAtendivel: 0,
        riscoRutura: false,
        insumoGargaloNome: 'Nenhum',
        deficitUnidades: 0,
        precoVendaUnitario: 14.0,
        perdaEstimadaReceita: 0,
      },
      {
        produtoId: 'prod-cheeseburger',
        nomeProduto: 'Cheeseburger Tradicional',
        demandaPrevista: 0,
        capacidadeMaximaProducao: 60,
        demandaAtendivel: 0,
        riscoRutura: false,
        insumoGargaloNome: 'Nenhum',
        deficitUnidades: 0,
        precoVendaUnitario: 29.9,
        perdaEstimadaReceita: 0,
      },
    ],
    sugestoesReposicao: isD1
      ? [
          {
            insumoId: '55555555-5555-5555-5555-555555555551',
            nomeInsumo: 'Bacon em Fatias Defumado',
            unidadeMedida: 'kg',
            stockAtual: 0,
            stockNecessario: 2.1,
            quantidadeComprar: 9.0,
            precoEstimadoUnitario: 28.0,
          },
        ]
      : [],
    contextoClimatico: DADOS_PREVISAO_PADRAO.contextoClimatico,
  };
}
