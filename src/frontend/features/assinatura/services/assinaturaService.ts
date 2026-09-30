import { apiClient } from '@/shared/services/api';
import { AssinaturaStatus } from '../types';

export const ASSINATURA_PADRAO: AssinaturaStatus = {
  restauranteId: '11111111-1111-1111-1111-111111111111',
  status: 'TRIAL',
  dataInicio: new Date().toISOString(),
  dataFimTrial: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
  diasRestantesTrial: 14,
  estaVigente: true,
  planosDisponiveis: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      nome: 'Plano Starter',
      descricao: 'Gestão completa de estoque, caixa e faturamento financeiro.',
      precoMensal: 99.00,
      possuiModuloIa: false,
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      nome: 'Plano Pro Inteligente (IA)',
      descricao: 'Tudo do Starter + Previsão de Demanda com Machine Learning e Alertas SSE.',
      precoMensal: 189.00,
      possuiModuloIa: true,
    },
  ],
};

export const assinaturaService = {
  async obterStatus(): Promise<AssinaturaStatus> {
    try {
      const response = await apiClient.get<AssinaturaStatus>('/assinatura/status');
      return response.data;
    } catch {
      return ASSINATURA_PADRAO;
    }
  },

  async assinarPlano(planoId: string, mesesVigencia = 1): Promise<AssinaturaStatus> {
    try {
      const response = await apiClient.post<AssinaturaStatus>('/assinatura/assinar', {
        planoId,
        mesesVigencia,
      });
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Não foi possível contratar o plano. Tente novamente.';
      throw new Error(msg);
    }
  },
};
