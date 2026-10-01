import {
  ShiftMetrics,
  TerminalStatus,
  MovimentacaoCaixaInput,
  MovimentacaoCaixaResult,
} from '../types';

export const perfilService = {
  async obterMetricasTurno(): Promise<ShiftMetrics> {
    // Retorna métricas agregadas do turno operacional em andamento
    return {
      turnoNumero: '#108',
      inicioTurno: '08:30',
      tempoDecorrido: 'Há 3h 15m',
      totalVendas: 24,
      ticketMedio: 53.35,
      volumeTotal: 1280.0,
      tendenciaPercentual: 18,
      tenderBreakdown: {
        pix: 720.0,
        cartao: 440.5,
        dinheiro: 120.0,
      },
    };
  },

  async obterStatusTerminal(sseConectado: boolean): Promise<TerminalStatus> {
    return {
      sseOnline: sseConectado,
      sseLatency: '18ms',
      impressoraNome: 'Bluetooth 80mm • Bobina 75%',
      impressoraStatus: 'Pronta',
      versaoApp: 'Versão 1.0.0',
      buildNumero: 'Build 104',
    };
  },

  async registrarMovimentacao(
    dados: MovimentacaoCaixaInput,
    saldoAtual: number
  ): Promise<MovimentacaoCaixaResult> {
    const delta = dados.tipo === 'SUPRIMENTO' ? dados.valor : -dados.valor;
    const novoSaldo = Math.max(0, saldoAtual + delta);
    const protocolo = `${dados.tipo.substring(0, 3)}-${Date.now().toString(36).toUpperCase()}`;

    return {
      sucesso: true,
      protocolo,
      novoSaldoDinheiro: novoSaldo,
      mensagem: `${
        dados.tipo === 'SUPRIMENTO' ? 'Suprimento de troco' : 'Sangria de caixa'
      } registrada com sucesso sob protocolo ${protocolo}.`,
    };
  },
};
