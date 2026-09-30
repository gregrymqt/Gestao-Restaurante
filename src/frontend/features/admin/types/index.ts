export type StatusAssinaturaAdmin = 'TRIAL' | 'ATIVA' | 'ATRASADA' | 'EXPIRADA' | 'CANCELADA';

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

export interface EstenderTrialPayload {
  readonly diasAdicionais: number;
}

export interface AlterarStatusPayload {
  readonly novoStatus: string;
  readonly planoId?: string;
}
