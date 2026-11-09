import { create } from 'zustand';
import { Produto, ItemComanda, ModificadorSelecionado } from '../types';

interface CarrinhoState {
  itens: ItemComanda[];
  comandaAtiva: string;
  adicionarItem: (produto: Produto, modificadores?: ModificadorSelecionado[]) => void;
  removerItem: (itemId: string) => void;
  alterarQuantidade: (itemId: string, quantidade: number) => void;
  limparCarrinho: () => void;
  obterTotalItens: () => number;
  obterSubtotal: () => number;
  obterSubtotalFormatado: () => string;
}

function gerarHashItem(produtoId: string, modificadores?: readonly ModificadorSelecionado[]): string {
  if (!modificadores || modificadores.length === 0) {
    return produtoId;
  }
  const idsOrdenados = modificadores
    .map((m) => m.opcaoId)
    .slice()
    .sort()
    .join('_');
  return `${produtoId}_${idsOrdenados}`;
}

export const useCarrinho = create<CarrinhoState>((set, get) => ({
  itens: [],
  comandaAtiva: '#042',

  adicionarItem: (produto: Produto, modificadores?: ModificadorSelecionado[]) => {
    set((state) => {
      const hash = gerarHashItem(produto.id, modificadores);
      const itemExistenteIndex = state.itens.findIndex((i) => i.id === hash);

      const adicionalTotal = (modificadores || []).reduce(
        (acc, m) => acc + (Number(m.precoAdicional) || 0),
        0
      );
      const precoUnitarioEfetivo = Number((produto.preco + adicionalTotal).toFixed(2));

      if (itemExistenteIndex >= 0) {
        const novosItens = [...state.itens];
        const itemAtual = novosItens[itemExistenteIndex];
        const novaQtd = itemAtual.quantidade + 1;
        novosItens[itemExistenteIndex] = {
          ...itemAtual,
          quantidade: novaQtd,
          subtotal: Number((novaQtd * itemAtual.precoUnitarioEfetivo).toFixed(2)),
        };
        return { itens: novosItens };
      }

      const novoItem: ItemComanda = {
        id: hash,
        produto,
        quantidade: 1,
        precoUnitarioEfetivo,
        modificadores: modificadores || [],
        subtotal: precoUnitarioEfetivo,
      };
      return { itens: [...state.itens, novoItem] };
    });
  },

  removerItem: (itemId: string) => {
    set((state) => ({
      itens: state.itens.filter((i) => i.id !== itemId),
    }));
  },

  alterarQuantidade: (itemId: string, quantidade: number) => {
    if (quantidade <= 0) {
      get().removerItem(itemId);
      return;
    }

    set((state) => ({
      itens: state.itens.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantidade,
            subtotal: Number((quantidade * item.precoUnitarioEfetivo).toFixed(2)),
          };
        }
        return item;
      }),
    }));
  },

  limparCarrinho: () => {
    set({ itens: [] });
  },

  obterTotalItens: () => {
    return get().itens.reduce((acc, item) => acc + item.quantidade, 0);
  },

  obterSubtotal: () => {
    const total = get().itens.reduce((acc, item) => acc + item.subtotal, 0);
    return Number(total.toFixed(2));
  },

  obterSubtotalFormatado: () => {
    const total = get().obterSubtotal();
    return `R$ ${total.toFixed(2).replace('.', ',')}`;
  },
}));
