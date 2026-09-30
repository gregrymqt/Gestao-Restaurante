import { apiClient } from '@/shared/services/api';
import { TenantAdminItem } from '../types';

export const TENANTS_ADMIN_PADRAO: TenantAdminItem[] = [
  {
    restauranteId: '11111111-1111-1111-1111-111111111111',
    nomeRestaurante: 'Restaurante Teste E2E (Matriz)',
    cnpj: '12.345.678/0001-90',
    cidade: 'São Paulo',
    estado: 'SP',
    dataCadastro: new Date().toISOString(),
    gestorNome: 'Lucas Vicente',
    gestorEmail: 'operador@restaurante.com',
    statusAssinatura: 'TRIAL',
    diasRestantesTrial: 14,
    dataFimTrial: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    planoNome: 'Plano Pro Inteligente (IA)',
    precoMensal: 189.00,
  },
  {
    restauranteId: '22222222-2222-2222-2222-222222222222',
    nomeRestaurante: 'Burger Prime Jardins',
    cnpj: '98.765.432/0001-10',
    cidade: 'São Paulo',
    estado: 'SP',
    dataCadastro: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    gestorNome: 'Mariana Lima',
    gestorEmail: 'mariana@burgerprime.com',
    statusAssinatura: 'ATIVA',
    diasRestantesTrial: 0,
    dataFimTrial: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    dataExpiracao: new Date(Date.now() + 1000 * 60 * 60 * 24 * 24).toISOString(),
    planoNome: 'Plano Starter',
    precoMensal: 99.00,
  },
];

export const adminService = {
  async listarTenants(): Promise<TenantAdminItem[]> {
    try {
      const response = await apiClient.get<TenantAdminItem[]>('/admin/tenants');
      if (response.data && response.data.length > 0) {
        return response.data;
      }
      return TENANTS_ADMIN_PADRAO;
    } catch {
      return TENANTS_ADMIN_PADRAO;
    }
  },

  async estenderTrial(restauranteId: string, diasAdicionais: number): Promise<TenantAdminItem> {
    try {
      const response = await apiClient.post<TenantAdminItem>(
        `/admin/tenants/${restauranteId}/estender-trial`,
        { diasAdicionais }
      );
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Falha ao estender dias de trial.';
      throw new Error(msg);
    }
  },

  async alterarStatus(
    restauranteId: string,
    novoStatus: string,
    planoId?: string
  ): Promise<TenantAdminItem> {
    try {
      const response = await apiClient.post<TenantAdminItem>(
        `/admin/tenants/${restauranteId}/alterar-status`,
        { novoStatus, planoId }
      );
      return response.data;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Falha ao alterar status de assinatura.';
      throw new Error(msg);
    }
  },
};
