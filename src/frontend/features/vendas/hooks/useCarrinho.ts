import { create } from 'zustand';
import { Produto, ItemComanda } from '../types';

interface CarrinhoState {
  itens: ItemComanda[];
  comandaAtiva: string;
  adicionarItem: (produto: Produto) => void;
  removerItem: (produtoId: string) => void;
  alterarQuantidade: (produtoId: string, quantidade: number) => void;
  limparCarrinho: () => void;
  obterTotalItens: () => number;
  obterSubtotal: () => number;
  obterSubtotalFormatado: () => string;
}

export const useCarrinho = create<CarrinhoState>((set, get) => ({
  itens: [],
  comandaAtiva: '#042',

  adicionarItem: (produto: Produto) => {
    set((state) => {
      const itemExistenteIndex = state.itens.findIndex(
        (i) => i.produto.id === produto.id
      );

      if (itemExistenteIndex >= 0) {
        const novosItens = [...state.itens];
        const itemAtual = novosItens[itemExistenteIndex];
        const novaQtd = itemAtual.quantidade + 1;
        novosItens[itemExistenteIndex] = {
          ...itemAtual,
          quantidade: novaQtd,
          subtotal: Number((novaQtd * produto.preco).toFixed(2)),
        };
        return { itens: novosItens };
      }

      const novoItem: ItemComanda = {
        produto,
        quantidade: 1,
        subtotal: Number(produto.preco.toFixed(2)),
      };
      return { itens: [...state.itens, novoItem] };
    });
  },

  removerItem: (produtoId: string) => {
    set((state) => ({
      itens: state.itens.filter((i) => i.produto.id !== produtoId),
    }));
  },

  alterarQuantidade: (produtoId: string, quantidade: number) => {
    if (quantidade <= 0) {
      get().removerItem(produtoId);
      return;
    }

    set((state) => ({
      itens: state.itens.map((item) => {
        if (item.produto.id === produtoId) {
          return {
            ...item,
            quantidade,
            subtotal: Number((quantidade * item.produto.preco).toFixed(2)),
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
