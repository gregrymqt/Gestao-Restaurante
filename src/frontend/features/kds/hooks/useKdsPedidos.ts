import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { kdsService } from '../services/kdsService';
import { PedidoKds, StatusPreparoKds } from '../types';

export const KDS_QUERY_KEY = ['kds-pedidos'] as const;

export function useKdsPedidos() {
  const queryClient = useQueryClient();

  const query = useQuery<PedidoKds[]>({
    queryKey: KDS_QUERY_KEY,
    queryFn: kdsService.listarPedidosAtivos,
    staleTime: 2000,
    refetchInterval: 15000, // Fallback leve (15s) caso o canal SSE oscile
  });

  const mutation = useMutation({
    mutationFn: ({ vendaId, statusPreparo }: { vendaId: string; statusPreparo: StatusPreparoKds }) =>
      kdsService.atualizarStatusPedido(vendaId, statusPreparo),
    onMutate: async ({ vendaId, statusPreparo }) => {
      await queryClient.cancelQueries({ queryKey: KDS_QUERY_KEY });
      const estadoAnterior = queryClient.getQueryData<PedidoKds[]>(KDS_QUERY_KEY);

      if (estadoAnterior) {
        const atualizado =
          statusPreparo === 'ENTREGUE' || statusPreparo === 'CANCELADO'
            ? estadoAnterior.filter((p) => p.vendaId !== vendaId)
            : estadoAnterior.map((p) =>
                p.vendaId === vendaId ? { ...p, statusPreparo } : p
              );

        queryClient.setQueryData<PedidoKds[]>(KDS_QUERY_KEY, atualizado);
      }

      return { estadoAnterior };
    },
    onError: (_err, _vars, contexto) => {
      if (contexto?.estadoAnterior) {
        queryClient.setQueryData(KDS_QUERY_KEY, contexto.estadoAnterior);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: KDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['vendas-historico'] });
    },
  });

  const agrupados = useMemo(() => {
    const lista = query.data ?? [];
    return {
      recebidos: lista.filter((p) => p.statusPreparo === 'RECEBIDO'),
      emPreparo: lista.filter((p) => p.statusPreparo === 'EM_PREPARO'),
      prontos: lista.filter((p) => p.statusPreparo === 'PRONTO'),
      todos: lista,
    };
  }, [query.data]);

  return {
    pedidos: agrupados.todos,
    recebidos: agrupados.recebidos,
    emPreparo: agrupados.emPreparo,
    prontos: agrupados.prontos,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isAtualizando: mutation.isPending,
    pedidoEmAtualizacaoId: mutation.isPending ? (mutation.variables?.vendaId ?? null) : null,
    refetch: query.refetch,
    avancarStatus: (vendaId: string, statusPreparo: StatusPreparoKds) =>
      mutation.mutate({ vendaId, statusPreparo }),
  };
}
