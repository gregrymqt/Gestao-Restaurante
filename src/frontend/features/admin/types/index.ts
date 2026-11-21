export type StatusAssinaturaAdmin = 'TRIAL' | 'ATIVA' | 'ATRASADA' | 'EXPIRADA' | 'CANCELADA';

export type FiltroStatusTenant = 'TODOS' | 'TRIAL' | 'ATIVA' | 'EXPIRADA';

export interface TenantAdminItem {
  readonly restauranteId: string;
  readonly nomeRestaurante: string;
  readonly cnpj: string;
  readonly cidade: string;
  readonly estado: string;
  readonly dataCadastro: string;
  readonly gestorNome: string;
  readonly gestorEmail: string;
  readonly statusAssinatura: StatusAssinaturaAdmin | string;
  readonly diasRestantesTrial: number;
  readonly dataFimTrial: string;
  readonly dataExpiracao?: string;
  readonly planoNome: string;
  readonly precoMensal: number;
}

export interface TenantsAdminPaginadoResponse {
  readonly itens: TenantAdminItem[];
  readonly totalItens: number;
  readonly paginaAtual: number;
  readonly totalPaginas: number;
}

export interface FiltroTenantsAdmin {
  readonly busca?: string;
  readonly status?: FiltroStatusTenant | string;
  readonly pagina?: number;
  readonly itensPorPagina?: number;
}

export interface EstenderTrialPayload {
  readonly diasAdicionais: number;
}

export interface AlterarStatusPayload {
  readonly novoStatus: string;
  readonly planoId?: string;
}
