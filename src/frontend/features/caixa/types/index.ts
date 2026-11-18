export type StatusSessaoCaixa = 'Aberta' | 'Fechada';

export interface MetodoPagamentoResumo {
  readonly id: string;
  readonly nome: string;
  readonly tipo: 'PIX' | 'Credito' | 'Debito' | 'Dinheiro';
  readonly valor: number;
  readonly percentual: number;
  readonly transacoesTexto: string;
  readonly badge?: string;
  readonly corBarra: string;
  readonly iconeVector: 'flash' | 'card' | 'cash';
  readonly corContainer: string;
}

export interface DadosClimaticos {
  readonly temperatura: number;
  readonly condicao: string;
  readonly umidade: number;
  readonly statusUmidade: string;
  readonly chuvaMm: number;
  readonly statusChuva: string;
}

export interface SessaoCaixaResumo {
  readonly id: string;
  readonly status: StatusSessaoCaixa;
  readonly terminal: string;
  readonly dataHoraFormatada: string;
  readonly turno: string;
  readonly operador: string;
  readonly totalApurado: number;
  readonly percentualMeta: number;
  readonly totalVendas: number;
  readonly ticketMedio: number;
  readonly pagamentos: readonly MetodoPagamentoResumo[];
}

export interface AbrirCaixaResponseDto {
  readonly fechamentoCaixaId: string;
  readonly restauranteId: string;
  readonly usuarioId: string;
  readonly dataAbertura: string;
  readonly status: string;
}

export interface FecharCaixaResponseDto {
  readonly fechamentoCaixaId: string;
  readonly restauranteId: string;
  readonly dataAbertura: string;
  readonly dataFechamento: string;
  readonly valorTotalVendas: number;
  readonly quantidadeVendas: number;
  readonly status: string;
  readonly correlationId: string;
}
