import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { estoqueService } from '../services/estoqueService';
import { InsumoEstoque, AbaEstoqueAtiva } from '../types';

export function useInsumosEstoque() {
  const [abaAtiva, setAbaAtiva] = useState<AbaEstoqueAtiva>('insumos');
  const [busca, setBusca] = useState<string>('');
  const [insumoSelecionado, setInsumoSelecionado] = useState<InsumoEstoque | null>(null);
  const [isModalEntradaOpen, setIsModalEntradaOpen] = useState<boolean>(false);

  const {
    data: insumos = [],
    isLoading: isLoadingInsumos,
    isRefetching: isRefetchingInsumos,
    refetch: refetchInsumos,
  } = useQuery({
    queryKey: ['insumos-estoque'],
    queryFn: () => estoqueService.obterInsumos(),
    staleTime: 1000 * 60 * 2,
  });

  const {
    data: fichas = [],
    isLoading: isLoadingFichas,
    isRefetching: isRefetchingFichas,
    refetch: refetchFichas,
  } = useQuery({
    queryKey: ['fichas-tecnicas'],
    queryFn: () => estoqueService.obterFichasTecnicas(),
    staleTime: 1000 * 60 * 5,
  });

  const insumosFiltrados = useMemo(() => {
    if (!busca.trim()) return insumos;
    const termo = busca.toLowerCase();
    return insumos.filter(
      (item) =>
        item.nome.toLowerCase().includes(termo) ||
        item.sku.toLowerCase().includes(termo) ||
        item.categoria.toLowerCase().includes(termo)
    );
  }, [insumos, busca]);

  const fichasFiltradas = useMemo(() => {
    if (!busca.trim()) return fichas;
    const termo = busca.toLowerCase();
    return fichas.filter(
      (f) =>
        f.nomeProduto.toLowerCase().includes(termo) ||
        f.sku.toLowerCase().includes(termo)
    );
  }, [fichas, busca]);

  const abrirModalEntrada = (insumo?: InsumoEstoque) => {
    setInsumoSelecionado(insumo || null);
    setIsModalEntradaOpen(true);
  };

  const fecharModalEntrada = () => {
    setIsModalEntradaOpen(false);
    setInsumoSelecionado(null);
  };

  return {
    abaAtiva,
    setAbaAtiva,
    busca,
    setBusca,
    insumos: insumosFiltrados,
    todosInsumos: insumos,
    fichas: fichasFiltradas,
    totalInsumos: insumos.length,
    totalFichas: fichas.length,
    isLoading: isLoadingInsumos || isLoadingFichas,
    isRefetching: isRefetchingInsumos || isRefetchingFichas,
    refetch: async () => {
      await Promise.all([refetchInsumos(), refetchFichas()]);
    },
    // Controle do Modal
    insumoSelecionado,
    isModalEntradaOpen,
    abrirModalEntrada,
    fecharModalEntrada,
  };
}
