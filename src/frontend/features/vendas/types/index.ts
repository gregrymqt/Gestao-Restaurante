export type CategoriaProduto =
  | 'Todos'
  | 'Hambúrgueres'
  | 'Porções'
  | 'Bebidas'
  | 'Sobremesas';

export type FormaPagamento = 'Dinheiro' | 'PIX' | 'Debito' | 'Credito';

export type TipoAcaoModificador = 'Culinario' | 'Adicional' | 'Remocao' | number;

export interface OpcaoModificador {
  readonly id: string;
  readonly nome: string;
  readonly precoAdicional: number;
  readonly insumoId?: string | null;
  readonly quantidadeInsumo: number;
  readonly tipoAcao: TipoAcaoModificador;
  readonly ativo?: boolean;
}

export interface GrupoModificador {
  readonly id: string;
  readonly nome: string;
  readonly descricao?: string | null;
  readonly obrigatorio: boolean;
  readonly minimoSelecoes: number;
  readonly maximoSelecoes: number;
  readonly opcoes: readonly OpcaoModificador[];
}

export interface ModificadorSelecionado {
  readonly opcaoId: string;
  readonly grupoId: string;
  readonly nome: string;
  readonly precoAdicional: number;
  readonly insumoId?: string | null;
  readonly quantidadeInsumo: number;
  readonly tipoAcao: TipoAcaoModificador;
}

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
  readonly id: string; // Chave única por assinatura de modificadores
  readonly produto: Produto;
  readonly quantidade: number;
  readonly subtotal: number;
  readonly precoUnitarioEfetivo: number;
  readonly modificadores: readonly ModificadorSelecionado[];
}

export interface EstadoComanda {
  readonly comandaId: string;
  readonly terminalId: string;
  readonly operador: string;
  readonly statusCaixa: 'Aberto' | 'Fechado';
}

export interface ItemVendaModificadorRequestDto {
  readonly opcaoId: string;
  readonly grupoId: string;
  readonly nome: string;
  readonly precoAdicional: number;
  readonly insumoId?: string | null;
  readonly quantidadeInsumo: number;
  readonly tipoAcao: number;
}

export interface ItemVendaRequestDto {
  readonly produtoId: string;
  readonly quantidade: number;
  readonly modificadores?: readonly ItemVendaModificadorRequestDto[];
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
  readonly modificadoresJson?: string | null;
}

export interface VendaResponseDto {
  readonly vendaId: string;
  readonly restauranteId: string;
  readonly fechamentoCaixaId: string;
  readonly dataHora: string;
  readonly status: string;
  readonly statusPreparo?: string;
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

export interface VendaHistoricoItem {
  readonly id: string;
  readonly produtoId: string;
  readonly nomeProduto: string;
  readonly quantidade: number;
  readonly precoUnitario: number;
  readonly subtotal: number;
  readonly modificadoresJson?: string | null;
}

export interface VendaHistorico {
  readonly vendaId: string;
  readonly restauranteId: string;
  readonly fechamentoCaixaId?: string | null;
  readonly dataHora: string;
  readonly status: string;
  readonly statusPreparo?: string;
  readonly formaPagamento: string;
  readonly valorTotal: number;
  readonly quantidadeItens: number;
  readonly itens: readonly VendaHistoricoItem[];
}
