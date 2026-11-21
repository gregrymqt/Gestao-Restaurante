import { apiClient, extractErrorMessage, isCancel } from '../../../shared/services/api';
import {
  TenantAdminItem,
  TenantsAdminPaginadoResponse,
  FiltroTenantsAdmin,
} from '../types';

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
  {
    restauranteId: '33333333-3333-3333-3333-333333333333',
    nomeRestaurante: 'Pizzaria Donna Bella',
    cnpj: '45.678.910/0001-30',
    cidade: 'Campinas',
    estado: 'SP',
    dataCadastro: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
    gestorNome: 'Roberto Santos',
    gestorEmail: 'roberto@donnabella.com',
    statusAssinatura: 'EXPIRADA',
    diasRestantesTrial: 0,
    dataFimTrial: new Date(Date.now() - 1000 * 60 * 60 * 24 * 26).toISOString(),
    dataExpiracao: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    planoNome: 'Nenhum (Trial Expirado)',
    precoMensal: 0,
  },
];

function filtrarMock(filtro?: FiltroTenantsAdmin): TenantsAdminPaginadoResponse {
  let itens = [...TENANTS_ADMIN_PADRAO];

  if (filtro?.busca && filtro.busca.trim().length > 0) {
    const termo = filtro.busca.toLowerCase().trim();
    itens = itens.filter(
      (t) =>
        t.nomeRestaurante.toLowerCase().includes(termo) ||
        t.cnpj.includes(termo) ||
        t.gestorNome.toLowerCase().includes(termo) ||
        t.gestorEmail.toLowerCase().includes(termo)
    );
  }

  if (filtro?.status && filtro.status !== 'TODOS') {
    itens = itens.filter((t) => t.statusAssinatura === filtro.status);
  }

  const pagina = filtro?.pagina && filtro.pagina > 0 ? filtro.pagina : 1;
  const itensPorPagina = filtro?.itensPorPagina && filtro.itensPorPagina > 0 ? filtro.itensPorPagina : 20;
  const totalItens = itens.length;
  const totalPaginas = Math.max(1, Math.ceil(totalItens / itensPorPagina));
  const inicio = (pagina - 1) * itensPorPagina;
  const itensPaginados = itens.slice(inicio, inicio + itensPorPagina);

  return {
    itens: itensPaginados,
    totalItens,
    paginaAtual: pagina,
    totalPaginas,
  };
}

export const adminService = {
  async listarTenants(
    filtro?: FiltroTenantsAdmin,
    signal?: AbortSignal
  ): Promise<TenantsAdminPaginadoResponse> {
    try {
      const params = new URLSearchParams();
      if (filtro?.busca) params.append('busca', filtro.busca.trim());
      if (filtro?.status && filtro.status !== 'TODOS') params.append('status', filtro.status);
      if (filtro?.pagina) params.append('pagina', String(filtro.pagina));
      if (filtro?.itensPorPagina) params.append('itensPorPagina', String(filtro.itensPorPagina));

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await apiClient.get<TenantsAdminPaginadoResponse | TenantAdminItem[]>(
        `/admin/tenants${queryString}`,
        { signal }
      );

      if (response.data) {
        if ('itens' in response.data && Array.isArray(response.data.itens)) {
          return response.data as TenantsAdminPaginadoResponse;
        }
        if (Array.isArray(response.data)) {
          return {
            itens: response.data,
            totalItens: response.data.length,
            paginaAtual: 1,
            totalPaginas: 1,
          };
        }
      }

      return filtrarMock(filtro);
    } catch (err: unknown) {
      if (isCancel(err)) throw err;
      return filtrarMock(filtro);
    }
  },

  async estenderTrial(
    restauranteId: string,
    diasAdicionais: number,
    signal?: AbortSignal
  ): Promise<TenantAdminItem> {
    try {
      const response = await apiClient.post<TenantAdminItem>(
        `/admin/tenants/${restauranteId}/estender-trial`,
        { diasAdicionais },
        { signal }
      );
      return response.data;
    } catch (err: unknown) {
      if (isCancel(err)) throw err;
      throw new Error(extractErrorMessage(err, 'Falha ao estender dias de trial.'));
    }
  },

  async alterarStatus(
    restauranteId: string,
    novoStatus: string,
    planoId?: string,
    signal?: AbortSignal
  ): Promise<TenantAdminItem> {
    try {
      const response = await apiClient.post<TenantAdminItem>(
        `/admin/tenants/${restauranteId}/alterar-status`,
        { novoStatus, planoId },
        { signal }
      );
      return response.data;
    } catch (err: unknown) {
      if (isCancel(err)) throw err;
      throw new Error(extractErrorMessage(err, 'Falha ao alterar status de assinatura.'));
    }
  },
};
