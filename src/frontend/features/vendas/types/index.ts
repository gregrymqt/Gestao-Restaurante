export type CategoriaProduto =
  | 'Todos'
  | 'Hambúrgueres'
  | 'Porções'
  | 'Bebidas'
  | 'Sobremesas';

export interface Produto {
  readonly id: string;
  readonly nome: string;
  readonly descricao?: string;
  readonly preco: number;
  readonly categoria: CategoriaProduto;
  readonly imagemUrl?: string;
  readonly estoqueRestante?: number;
  readonly ativo: boolean;
}

export interface ItemComanda {
  readonly produto: Produto;
  readonly quantidade: number;
  readonly subtotal: number;
}

export interface EstadoComanda {
  readonly comandaId: string;
  readonly terminalId: string;
  readonly operador: string;
  readonly statusCaixa: 'Aberto' | 'Fechado';
}
