export type CategoriaProduto =
  | 'Todos'
  | 'Hambúrgueres'
  | 'Porções'
  | 'Bebidas'
  | 'Sobremesas';

export type FormaPagamento = 'Dinheiro' | 'PIX' | 'Debito' | 'Credito';

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

export interface ItemVendaRequestDto {
  readonly produtoId: string;
  readonly quantidade: number;
}

export interface RegistrarVendaRequestDto {
  readonly formaPagamento: FormaPagamento;
  readonly itens: readonly ItemVendaRequestDto[];
}

export interface ItemVendaResponseDto {
  readonly id: string;
  readonly produtoId: string;
  readonly quantidade: number;
  readonly precoUnitario: number;
  readonly subtotal: number;
}

export interface VendaResponseDto {
  readonly vendaId: string;
  readonly restauranteId: string;
  readonly fechamentoCaixaId: string;
  readonly dataHora: string;
  readonly status: string;
  readonly formaPagamento: string;
  readonly valorTotal: number;
  readonly itens: readonly ItemVendaResponseDto[];
}

export interface ItemFichaTecnicaInput {
  readonly insumoId: string;
  readonly quantidade: number;
}

export interface CriarProdutoInput {
  readonly nome: string;
  readonly preco: number;
  readonly categoria: CategoriaProduto;
  readonly descricao?: string;
  readonly fichaTecnica?: readonly ItemFichaTecnicaInput[];
}
