import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Produto, CategoriaProduto } from '../types';
import { vendasService } from '../services/vendasService';

export const PRODUTOS_CATALOGO_INICIAL: Produto[] = [
  {
    id: '55555555-5555-5555-5555-555555555555',
    nome: 'Hambúrguer Artesanal Supremo',
    descricao: 'Delicioso hambúrguer artesanal com blend angus, pão brioche e queijo cheddar derretido.',
    preco: 38.00,
    categoria: 'Hambúrgueres',
    estoqueRestante: 10,
    ativo: true,
  },
  {
    id: '55555555-5555-5555-5555-555555555552',
    nome: 'Double Smash Bacon',
    descricao: '2x blend smash 90g, muito bacon crocante e queijo prato.',
    preco: 42.00,
    categoria: 'Hambúrgueres',
    estoqueRestante: 8,
    ativo: true,
  },
  {
    id: '55555555-5555-5555-5555-555555555553',
    nome: 'Batata Rústica Trufada',
    descricao: 'Batatas crocantes com azeite trufado e queijo parmesão ralado.',
    preco: 26.50,
    categoria: 'Porções',
    estoqueRestante: 15,
    ativo: true,
  },
  {
    id: '55555555-5555-5555-5555-555555555554',
    nome: 'Onion Rings Crocantes',
    descricao: 'Anéis de cebola empanados acompanhados de molho barbecue.',
    preco: 22.00,
    categoria: 'Porções',
    estoqueRestante: 12,
    ativo: true,
  },
  {
    id: '55555555-5555-5555-5555-555555555556',
    nome: 'Refrigerante Lata 350ml',
    descricao: 'Coca-Cola, Guaraná Antarctica ou Água Tônica.',
    preco: 7.50,
    categoria: 'Bebidas',
    estoqueRestante: 50,
    ativo: true,
  },
  {
    id: '55555555-5555-5555-5555-555555555557',
    nome: 'Suco de Laranja Natural',
    descricao: 'Suco integral 400ml preparado na hora.',
    preco: 12.00,
    categoria: 'Bebidas',
    estoqueRestante: 20,
    ativo: true,
  },
  {
    id: '55555555-5555-5555-5555-555555555558',
    nome: 'Pudim de Leite Artesanal',
    descricao: 'Fatia individual de pudim tradicional com calda de caramelo.',
    preco: 14.00,
    categoria: 'Sobremesas',
    estoqueRestante: 6,
    ativo: true,
  },
  {
    id: '55555555-5555-5555-5555-555555555559',
    nome: 'Brownie com Sorvete',
    descricao: 'Brownie de chocolate belga aquecido com sorvete de creme.',
    preco: 18.90,
    categoria: 'Sobremesas',
    estoqueRestante: 3,
    ativo: true,
  },
];

export function useCatalogoProdutos(
  categoriaSelecionada: CategoriaProduto = 'Todos',
  termoBusca: string = ''
) {
  const { data: produtos = PRODUTOS_CATALOGO_INICIAL, isLoading, isError, refetch } = useQuery({
    queryKey: ['produtos', 'catalogo'],
    queryFn: async (): Promise<Produto[]> => {
      try {
        const backendProdutos = await vendasService.obterProdutos();
        if (backendProdutos && backendProdutos.length > 0) {
          return backendProdutos;
        }
        return PRODUTOS_CATALOGO_INICIAL;
      } catch (error) {
        console.warn(
          'Falha ao sincronizar catálogo do backend. Utilizando catálogo local resiliente:',
          error
        );
        return PRODUTOS_CATALOGO_INICIAL;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos de cache
  });

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      const atendeCategoria =
        categoriaSelecionada === 'Todos' || produto.categoria === categoriaSelecionada;

      const atendeBusca =
        !termoBusca ||
        produto.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
        (produto.descricao && produto.descricao.toLowerCase().includes(termoBusca.toLowerCase()));

      return atendeCategoria && atendeBusca && produto.ativo;
    });
  }, [produtos, categoriaSelecionada, termoBusca]);

  return {
    produtos: produtosFiltrados,
    totalProdutos: produtosFiltrados.length,
    isLoading,
    isError,
    refetch,
  };
}
