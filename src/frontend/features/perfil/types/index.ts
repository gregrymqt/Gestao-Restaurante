export interface ShiftMetrics {
  turnoNumero: string;
  inicioTurno: string;
  tempoDecorrido: string;
  totalVendas: number;
  ticketMedio: number;
  volumeTotal: number;
  tendenciaPercentual: number;
  tenderBreakdown: {
    pix: number;
    cartao: number;
    dinheiro: number;
  };
}

export interface TerminalStatus {
  sseOnline: boolean;
  sseLatency: string;
  impressoraNome: string;
  impressoraStatus: 'Pronta' | 'Atenção' | 'Offline';
  versaoApp: string;
  buildNumero: string;
}

export type TipoMovimentacaoCaixa = 'SUPRIMENTO' | 'SANGRIA';

export interface MovimentacaoCaixaInput {
  tipo: TipoMovimentacaoCaixa;
  valor: number;
  motivo: string;
}

export interface MovimentacaoCaixaResult {
  sucesso: boolean;
  protocolo: string;
  novoSaldoDinheiro: number;
  mensagem: string;
}
