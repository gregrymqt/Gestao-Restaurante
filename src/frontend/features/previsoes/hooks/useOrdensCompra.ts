import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { previsoesService } from '../services/previsoesService';
import {
  OrdemCompraDetalhe,
  StatusOrdemCompra,
  AtualizarStatusOrdemCompraInput,
  ReceberOrdemCompraResponse,
} from '../types';

export type FiltroStatusOrdem = 'TODAS' | StatusOrdemCompra;

export function useOrdensCompra() {
  const queryClient = useQueryClient();
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatusOrdem>('TODAS');
  const [busca, setBusca] = useState<string>('');

  const statusQueryParam = filtroStatus === 'TODAS' ? undefined : filtroStatus;

  const {
    data: ordens = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<OrdemCompraDetalhe[], Error>({
    queryKey: ['ordens-compra', statusQueryParam],
    queryFn: ({ signal }) => previsoesService.listarOrdensCompra(statusQueryParam, signal),
    staleTime: 1000 * 30, // 30s
  });

  const atualizarStatusMutation = useMutation<
    OrdemCompraDetalhe,
    Error,
    { id: string; input: AtualizarStatusOrdemCompraInput; signal?: AbortSignal }
  >({
    mutationFn: ({ id, input, signal }) =>
      previsoesService.atualizarStatusOrdemCompra(id, input, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-compra'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-executivo'] });
    },
  });

  const receberOrdemMutation = useMutation<
    ReceberOrdemCompraResponse,
    Error,
    { id: string; signal?: AbortSignal }
  >({
    mutationFn: ({ id, signal }) => previsoesService.receberOrdemCompra(id, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-compra'] });
      queryClient.invalidateQueries({ queryKey: ['insumos-estoque'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-executivo'] });
      queryClient.invalidateQueries({ queryKey: ['capacidade-producao'] });
    },
  });

  const ordensFiltradas = useMemo(() => {
    let resultado = ordens;

    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      resultado = resultado.filter(
        (o) =>
          o.protocolo.toLowerCase().includes(termo) ||
          (o.fornecedor && o.fornecedor.toLowerCase().includes(termo)) ||
          o.itens.some((i) => i.nomeInsumo.toLowerCase().includes(termo))
      );
    }

    return resultado;
  }, [ordens, busca]);

  const contadores = useMemo(() => {
    const pendentes = ordens.filter((o) => o.status === 'PENDENTE').length;
    const aprovadas = ordens.filter((o) => o.status === 'APROVADA').length;
    const recebidas = ordens.filter((o) => o.status === 'RECEBIDA').length;
    return {
      todas: ordens.length,
      pendentes,
      aprovadas,
      recebidas,
    };
  }, [ordens]);

  return {
    ordens: ordensFiltradas,
    todasOrdens: ordens,
    contadores,
    isLoading,
    isRefetching,
    refetch,
    filtroStatus,
    setFiltroStatus,
    busca,
    setBusca,
    atualizarStatusMutation,
    receberOrdemMutation,
  };
}
