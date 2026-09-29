import { ShiftMetrics, TerminalStatus } from '../types';

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
      versaoApp: 'Expo SDK 57 • v1.0.0',
      buildNumero: 'Build 104',
    };
  },
};
