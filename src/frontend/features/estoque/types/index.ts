export type AbaEstoqueAtiva = 'insumos' | 'fichas';

export type StatusNivelEstoque = 'critico' | 'atencao' | 'normal';

export interface InsumoEstoque {
  id: string;
  nome: string;
  sku: string;
  categoria: string;
  localizacao?: string;
  saldoAtual: number;
  estoqueMinimo: number;
  estoqueIdeal?: number;
  unidadeMedida: string;
  statusNivel: StatusNivelEstoque;
  percentualCapacidade: number;
  deficitQuantidade?: number;
  deficitPercentual?: number;
  leadTimeHoras?: number;
  observacaoConsumo?: string;
  custoUnitarioMedio?: number;
}

export interface IngredienteFicha {
  insumoId: string;
  nome: string;
  quantidade: string;
  isGargalo?: boolean;
}

export interface FichaTecnicaItem {
  id: string;
  produtoId: string;
  nomeProduto: string;
  sku: string;
  versaoBom?: string;
  tempoPreparoMin?: number;
  imagemUrl?: string;
  ingredientes: IngredienteFicha[];
  custoInsumos: number;
  precoBalcao: number;
  margemBrutaPercentual: number;
  capacidadeTurnoPorcoes: number;
  insumoLimitanteNome?: string;
}

export interface EntradaEstoqueInput {
  insumoId: string;
  quantidade: number;
  custoUnitario?: number;
  observacao?: string;
}

export interface EntradaEstoqueResponse {
  id: string;
  insumoId: string;
  quantidadeAdicionada: number;
  novoSaldo: number;
  dataHora: string;
  protocoloLedger: string;
}

export interface CadastrarInsumoInput {
  readonly nome: string;
  readonly unidadeMedida: string;
  readonly estoqueMinimo: number;
  readonly custoUnitario: number;
  readonly saldoInicial?: number;
  readonly categoria?: string;
}

export type MotivoBaixaEstoque = 'Avaria' | 'Validade' | 'Inventario';

export interface BaixaEstoqueInput {
  insumoId: string;
  quantidade: number;
  motivo: MotivoBaixaEstoque;
  observacao?: string;
}
