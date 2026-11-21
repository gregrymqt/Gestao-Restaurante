import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppDialog } from '@/shared/components/AppDialog';
import { useSseStatus } from '@/shared/hooks/useSseStatus';
import { adminService, TENANTS_ADMIN_PADRAO } from '../services/adminService';
import {
  TenantAdminItem,
  TenantsAdminPaginadoResponse,
  FiltroStatusTenant,
} from '../types';

const RESPOSTA_PADRAO: TenantsAdminPaginadoResponse = {
  itens: TENANTS_ADMIN_PADRAO,
  totalItens: TENANTS_ADMIN_PADRAO.length,
  paginaAtual: 1,
  totalPaginas: 1,
};

export function useAdminTenants() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');
  const [debounceBusca, setDebounceBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<FiltroStatusTenant>('TODOS');
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Debounce de 300ms para evitar requisições a cada tecla
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounceBusca(busca);
      setPaginaAtual(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [busca]);

  const {
    data: resposta = RESPOSTA_PADRAO,
    isLoading,
    refetch,
  } = useQuery<TenantsAdminPaginadoResponse>({
    queryKey: ['admin', 'tenants', debounceBusca, statusFiltro, paginaAtual],
    queryFn: () =>
      adminService.listarTenants({
        busca: debounceBusca,
        status: statusFiltro,
        pagina: paginaAtual,
        itensPorPagina: 20,
      }),
    staleTime: 1000 * 30, // 30 segundos
  });

  const estenderMutation = useMutation({
    mutationFn: ({ restauranteId, dias }: { restauranteId: string; dias: number }) =>
      adminService.estenderTrial(restauranteId, dias),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      useSseStatus.getState().showToast({
        titulo: 'Trial Estendido! 🎉',
        mensagem: `+${updated.diasRestantesTrial}d adicionados para ${updated.nomeRestaurante}.`,
        tipo: 'sucesso',
        icone: '⏳',
      });
    },
    onError: (err: Error) => {
      AppDialog.error('Erro na Operação', err.message);
    },
  });

  const alterarStatusMutation = useMutation({
    mutationFn: ({
      restauranteId,
      novoStatus,
      planoId,
    }: {
      restauranteId: string;
      novoStatus: string;
      planoId?: string;
    }) => adminService.alterarStatus(restauranteId, novoStatus, planoId),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      useSseStatus.getState().showToast({
        titulo: 'Status Atualizado! 🔒',
        mensagem: `Loja ${updated.nomeRestaurante} alterada para status: ${updated.statusAssinatura}.`,
        tipo: updated.statusAssinatura === 'EXPIRADA' ? 'critico' : 'sucesso',
        icone: updated.statusAssinatura === 'EXPIRADA' ? '⚠️' : '✓',
      });
    },
    onError: (err: Error) => {
      AppDialog.error('Erro na Operação', err.message);
    },
  });

  return {
    tenants: resposta.itens,
    totalItens: resposta.totalItens,
    totalPaginas: resposta.totalPaginas,
    paginaAtual,
    setPaginaAtual,
    busca,
    setBusca,
    statusFiltro,
    setStatusFiltro: (status: FiltroStatusTenant) => {
      setStatusFiltro(status);
      setPaginaAtual(1);
    },
    limparFiltros: () => {
      setBusca('');
      setDebounceBusca('');
      setStatusFiltro('TODOS');
      setPaginaAtual(1);
    },
    isLoading,
    refetch,
    estenderTrial: estenderMutation.mutate,
    isEstendendo: estenderMutation.isPending,
    alterarStatus: alterarStatusMutation.mutate,
    isAlterando: alterarStatusMutation.isPending,
  };
}
