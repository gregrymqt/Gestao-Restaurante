export interface KpisFaturamento {
  readonly totalFaturadoDia: number;
  readonly quantidadePedidos: number;
  readonly ticketMedio: number;
  readonly percentualMeta: number;
  readonly faturamentoOntem: number;
}

export interface InsumoCriticoResumo {
  readonly id: string;
  readonly nome: string;
  readonly quantidadeAtual: number;
  readonly quantidadeMinima: number;
  readonly unidadeMedida: string;
}

export interface PrevisaoIaResumo {
  readonly dataAlvoFormatada: string;
  readonly totalItensPrevistos: number;
  readonly variacaoPercentual: number;
  readonly condicaoClimaPrevista: string;
  readonly produtoDestaque: string;
}

export interface DashboardExecutivoData {
  readonly statusLoja: 'ABERTA' | 'FECHADA';
  readonly turnoAtual: string;
  readonly kpis: KpisFaturamento;
  readonly insumosCriticos: readonly InsumoCriticoResumo[];
  readonly previsaoIa: PrevisaoIaResumo;
}
