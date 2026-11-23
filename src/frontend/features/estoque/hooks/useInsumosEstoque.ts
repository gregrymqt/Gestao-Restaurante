import { useState, useMemo, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  estoqueService,
  INSUMOS_MOCK_INICIAL,
  FICHAS_TECNICAS_MOCK_INICIAL,
} from '../services/estoqueService';
import {
  InsumoEstoque,
  AbaEstoqueAtiva,
  FiltroRapidoEstoque,
  FichaTecnicaItem,
  FichaTecnicaInput,
} from '../types';

export function useInsumosEstoque() {
  const queryClient = useQueryClient();
  const { aba } = useLocalSearchParams<{ aba?: string }>();
  const [abaAtiva, setAbaAtiva] = useState<AbaEstoqueAtiva>(() =>
    aba === 'fichas' ? 'fichas' : aba === 'ordens' ? 'ordens' : 'insumos'
  );

  useEffect(() => {
    if (aba === 'fichas') {
      setAbaAtiva('fichas');
    } else if (aba === 'ordens') {
      setAbaAtiva('ordens');
    }
  }, [aba]);
  const [filtroRapido, setFiltroRapido] = useState<FiltroRapidoEstoque>('todos');
  const [busca, setBusca] = useState<string>('');

  // Controle de Modais de Estoque
  const [insumoSelecionado, setInsumoSelecionado] = useState<InsumoEstoque | null>(null);
  const [isModalEntradaOpen, setIsModalEntradaOpen] = useState<boolean>(false);

  // Controle de Modal de Ficha Técnica (BOM)
  const [isModalFichaOpen, setIsModalFichaOpen] = useState<boolean>(false);
  const [fichaEdicao, setFichaEdicao] = useState<FichaTecnicaItem | null>(null);

  const {
    data: insumos = INSUMOS_MOCK_INICIAL,
    isLoading: isLoadingInsumos,
    isRefetching: isRefetchingInsumos,
    refetch: refetchInsumos,
  } = useQuery({
    queryKey: ['insumos-estoque'],
    queryFn: ({ signal }) => estoqueService.obterInsumos(signal),
    initialData: INSUMOS_MOCK_INICIAL,
    staleTime: 1000 * 60 * 2,
  });

  const {
    data: fichas = FICHAS_TECNICAS_MOCK_INICIAL,
    isLoading: isLoadingFichas,
    isRefetching: isRefetchingFichas,
    refetch: refetchFichas,
  } = useQuery({
    queryKey: ['fichas-tecnicas'],
    queryFn: ({ signal }) => estoqueService.obterFichasTecnicas(signal),
    initialData: FICHAS_TECNICAS_MOCK_INICIAL,
    staleTime: 1000 * 60 * 5,
  });

  // Mutação para criar ou atualizar ficha técnica
  const salvarFichaMutation = useMutation({
    mutationFn: (dados: FichaTecnicaInput) => estoqueService.salvarFichaTecnica(dados),
    onSuccess: (novaFicha) => {
      queryClient.setQueryData<FichaTecnicaItem[]>(['fichas-tecnicas'], (old = []) => {
        const existeIndex = old.findIndex((f) => f.id === novaFicha.id);
        if (existeIndex >= 0) {
          const cop = [...old];
          cop[existeIndex] = { ...cop[existeIndex], ...novaFicha };
          return cop;
        }
        return [novaFicha, ...old];
      });
      fecharModalFicha();
    },
  });

  // Contadores para filtros rápidos
  const totalCriticos = useMemo(
    () => insumos.filter((i) => i.statusNivel === 'critico' || i.saldoAtual <= i.estoqueMinimo).length,
    [insumos]
  );
  const totalSeguros = useMemo(
    () => insumos.filter((i) => i.statusNivel === 'normal' && i.saldoAtual > i.estoqueMinimo).length,
    [insumos]
  );

  // Ordenação prioritária por criticidade (Críticos > Atenção > Normal)
  const insumosOrdenados = useMemo(() => {
    const prioridade: Record<string, number> = { critico: 0, atencao: 1, normal: 2 };
    return [...insumos].sort((a, b) => {
      const pA = prioridade[a.statusNivel] ?? 1;
      const pB = prioridade[b.statusNivel] ?? 1;
      if (pA !== pB) return pA - pB;
      return a.nome.localeCompare(b.nome);
    });
  }, [insumos]);

  // Filtragem por busca e por pílula rápida
  const insumosFiltrados = useMemo(() => {
    let lista = insumosOrdenados;

    if (filtroRapido === 'criticos') {
      lista = lista.filter((i) => i.statusNivel === 'critico' || i.saldoAtual <= i.estoqueMinimo);
    } else if (filtroRapido === 'seguros') {
      lista = lista.filter((i) => i.statusNivel === 'normal' && i.saldoAtual > i.estoqueMinimo);
    }

    if (!busca.trim()) return lista;
    const termo = busca.toLowerCase();
    return lista.filter(
      (item) =>
        item.nome.toLowerCase().includes(termo) ||
        item.sku.toLowerCase().includes(termo) ||
        item.categoria.toLowerCase().includes(termo)
    );
  }, [insumosOrdenados, filtroRapido, busca]);

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

  const abrirModalNovaFicha = () => {
    setFichaEdicao(null);
    setIsModalFichaOpen(true);
  };

  const abrirModalEditarFicha = (ficha: FichaTecnicaItem) => {
    setFichaEdicao(ficha);
    setIsModalFichaOpen(true);
  };

  const fecharModalFicha = () => {
    setIsModalFichaOpen(false);
    setFichaEdicao(null);
  };

  return {
    abaAtiva,
    setAbaAtiva,
    filtroRapido,
    setFiltroRapido,
    busca,
    setBusca,
    insumos: insumosFiltrados,
    todosInsumos: insumos,
    fichas: fichasFiltradas,
    totalInsumos: insumos.length,
    totalFichas: fichas.length,
    totalCriticos,
    totalSeguros,
    isLoading: isLoadingInsumos || isLoadingFichas,
    isRefetching: isRefetchingInsumos || isRefetchingFichas,
    refetch: async () => {
      await Promise.all([refetchInsumos(), refetchFichas()]);
    },
    // Modais de Insumos
    insumoSelecionado,
    isModalEntradaOpen,
    abrirModalEntrada,
    fecharModalEntrada,
    // Modal de Ficha Técnica
    isModalFichaOpen,
    fichaEdicao,
    abrirModalNovaFicha,
    abrirModalEditarFicha,
    fecharModalFicha,
    salvarFichaMutation,
  };
}
