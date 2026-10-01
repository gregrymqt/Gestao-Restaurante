export interface ItemCapacidadeProducao {
  produtoId: string;
  nomeProduto: string;
  demandaPrevista: number;
  capacidadeMaximaProducao: number;
  demandaAtendivel: number;
  riscoRutura: boolean;
  insumoGargaloId?: string;
  insumoGargaloNome: string;
  deficitUnidades: number;
  precoVendaUnitario?: number;
  perdaEstimadaReceita?: number;
}

export interface SugestaoReposicaoInsumo {
  insumoId: string;
  nomeInsumo: string;
  unidadeMedida: string;
  stockAtual: number;
  stockNecessario: number;
  quantidadeComprar: number;
  precoEstimadoUnitario?: number;
}

export interface FichaTecnicaIngrediente {
  insumoId: string;
  nomeInsumo: string;
  quantidadePorPorcao: number;
  unidadeMedida: string;
  estoqueAtual: number;
  estoqueNecessario: number;
  capacidadeMaxItem: number;
  isGargalo: boolean;
}

export interface RelatorioCapacidadeProducao {
  dataReferencia: string;
  itensCapacidade: ItemCapacidadeProducao[];
  sugestoesReposicao: SugestaoReposicaoInsumo[];
  contextoClimatico?: {
    temperatura: number;
    condicao: string;
    precipitacaoMm: number;
    impactoDescricao: string;
  };
}

export interface DataOpcaoFiltro {
  label: string;
  sublabel: string;
  dataAlvo: string;
}
