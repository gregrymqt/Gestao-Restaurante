export type StatusPreparoKds =
  | 'RECEBIDO'
  | 'EM_PREPARO'
  | 'PRONTO'
  | 'ENTREGUE'
  | 'CANCELADO';

export type NivelSlaKds = 'VERDE' | 'AMARELO' | 'VERMELHO';

export interface ModificadorKds {
  readonly nome: string;
  readonly tipoAcao: string;
  readonly precoAdicional: number;
}

export interface ItemPedidoKds {
  readonly id: string;
  readonly produtoId: string;
  readonly nomeProduto: string;
  readonly quantidade: number;
  readonly modificadores: readonly ModificadorKds[];
}

export interface PedidoKds {
  readonly vendaId: string;
  readonly codigoCurto: string;
  readonly dataHora: string;
  readonly statusPreparo: StatusPreparoKds;
  readonly preparoIniciadoEm?: string | null;
  readonly prontoEm?: string | null;
  readonly itens: readonly ItemPedidoKds[];
}
