import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Produto, CategoriaProduto } from '../types';

const PRODUTOS_CATALOGO_INICIAL: Produto[] = [
  {
    id: 'p-001',
    nome: 'X-Burger Artesanal',
    descricao: 'Pão brioche, blend 180g, queijo cheddar e maionese da casa.',
    preco: 34.90,
    categoria: 'Hambúrgueres',
    estoqueRestante: 4,
    ativo: true,
  },
  {
    id: 'p-002',
    nome: 'Double Smash Bacon',
    descricao: '2x blend smash 90g, muito bacon crocante e queijo prato.',
    preco: 42.00,
    categoria: 'Hambúrgueres',
    estoqueRestante: 8,
    ativo: true,
  },
  {
    id: 'p-003',
    nome: 'Batata Rústica Trufada',
    descricao: 'Batatas crocantes com azeite trufado e queijo parmesão ralado.',
    preco: 26.50,
    categoria: 'Porções',
    estoqueRestante: 15,
    ativo: true,
  },
  {
    id: 'p-004',
    nome: 'Onion Rings Crocantes',
    descricao: 'Anéis de cebola empanados acompanhados de molho barbecue.',
    preco: 22.00,
    categoria: 'Porções',
    estoqueRestante: 12,
    ativo: true,
  },
  {
    id: 'p-005',
    nome: 'Refrigerante Lata 350ml',
    descricao: 'Coca-Cola, Guaraná Antarctica ou Água Tônica.',
    preco: 7.50,
    categoria: 'Bebidas',
    estoqueRestante: 50,
    ativo: true,
  },
  {
    id: 'p-006',
    nome: 'Suco de Laranja Natural',
    descricao: 'Suco integral 400ml preparado na hora.',
    preco: 12.00,
    categoria: 'Bebidas',
    estoqueRestante: 20,
    ativo: true,
  },
  {
    id: 'p-007',
    nome: 'Pudim de Leite Artesanal',
    descricao: 'Fatia individual de pudim tradicional com calda de caramelo.',
    preco: 14.00,
    categoria: 'Sobremesas',
    estoqueRestante: 6,
    ativo: true,
  },
  {
    id: 'p-008',
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
      // Retorna os dados enriquecidos locais para garantia de disponibilidade imediata no PDV
      return PRODUTOS_CATALOGO_INICIAL;
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
