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
  custoUnitario?: number;
  custoUnitarioPorcao?: number;
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

export type StatusOrdemCompra = 'PENDENTE' | 'APROVADA' | 'RECEBIDA' | 'CANCELADA';

export interface ItemOrdemCompraDetalhe {
  id: string;
  insumoId: string;
  nomeInsumo: string;
  unidadeMedida: string;
  quantidade: number;
  precoUnitarioEstimado: number;
  subtotalEstimado: number;
}

export interface OrdemCompraDetalhe {
  id: string;
  protocolo: string;
  status: StatusOrdemCompra;
  valorTotalEstimado: number;
  fornecedor?: string | null;
  observacao?: string | null;
  criadoEm: string;
  atualizadoEm?: string | null;
  itens: ItemOrdemCompraDetalhe[];
}

export interface AtualizarStatusOrdemCompraInput {
  novoStatus: StatusOrdemCompra;
  fornecedor?: string;
  observacao?: string;
}

export interface ReceberOrdemCompraResponse {
  ordemCompraId: string;
  protocolo: string;
  status: string;
  totalItensCreditados: number;
  dataHoraRecebimento: string;
  mensagem: string;
}
