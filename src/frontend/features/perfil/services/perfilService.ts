import { apiClient, extractErrorMessage } from '@/services/api';
import {
  ShiftMetrics,
  TerminalStatus,
  MovimentacaoCaixaInput,
  MovimentacaoCaixaResult,
} from '../types';

export const perfilService = {
  async obterMetricasTurno(): Promise<ShiftMetrics> {
    const response = await apiClient.get<ShiftMetrics>('/caixa/resumo-turno');
    return response.data;
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
    _saldoAtual?: number
  ): Promise<MovimentacaoCaixaResult> {
    const rota = dados.tipo === 'SUPRIMENTO' ? '/caixa/suprimento' : '/caixa/sangria';
    try {
      const response = await apiClient.post<{
        id: string;
        tipo: string;
        valor: number;
        motivo: string;
        saldoAtualDinheiro: number;
        protocolo: string;
        dataHora: string;
        sucesso?: boolean;
        mensagem?: string;
      }>(rota, {
        valor: dados.valor,
        motivo: dados.motivo,
      });

      const data = response.data;
      const rotulo = dados.tipo === 'SUPRIMENTO' ? 'Suprimento de troco' : 'Sangria de caixa';

      return {
        sucesso: data.sucesso ?? true,
        protocolo: data.protocolo,
        novoSaldoDinheiro: data.saldoAtualDinheiro,
        mensagem: data.mensagem || `${rotulo} registrado com sucesso sob protocolo ${data.protocolo}.`,
      };
    } catch (err: unknown) {
      throw new Error(extractErrorMessage(err, 'Não foi possível registrar o lançamento de caixa.'));
    }
  },
};
