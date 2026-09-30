export type StatusAssinatura = 'TRIAL' | 'ATIVA' | 'ATRASADA' | 'EXPIRADA' | 'CANCELADA';

export interface PlanoItem {
  readonly id: string;
  readonly nome: string;
  readonly descricao: string;
  readonly precoMensal: number;
  readonly possuiModuloIa: boolean;
}

export interface AssinaturaStatus {
  readonly restauranteId: string;
  readonly status: StatusAssinatura;
  readonly dataInicio: string;
  readonly dataFimTrial: string;
  readonly dataExpiracao?: string;
  readonly diasRestantesTrial: number;
  readonly estaVigente: boolean;
  readonly planoAtual?: PlanoItem;
  readonly planosDisponiveis: readonly PlanoItem[];
}
