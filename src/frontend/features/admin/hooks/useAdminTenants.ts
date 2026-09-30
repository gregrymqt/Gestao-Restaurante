import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppDialog } from '@/shared/components/AppDialog';
import { adminService, TENANTS_ADMIN_PADRAO } from '../services/adminService';
import { TenantAdminItem } from '../types';

export function useAdminTenants() {
  const queryClient = useQueryClient();

  const {
    data: tenants = TENANTS_ADMIN_PADRAO,
    isLoading,
    refetch,
  } = useQuery<TenantAdminItem[]>({
    queryKey: ['admin', 'tenants'],
    queryFn: () => adminService.listarTenants(),
    staleTime: 1000 * 30, // 30 segundos
  });

  const estenderMutation = useMutation({
    mutationFn: ({ restauranteId, dias }: { restauranteId: string; dias: number }) =>
      adminService.estenderTrial(restauranteId, dias),
    onSuccess: (updated) => {
      queryClient.setQueryData<TenantAdminItem[]>(['admin', 'tenants'], (old = []) =>
        old.map((t) => (t.restauranteId === updated.restauranteId ? updated : t))
      );
      AppDialog.success(
        'Trial Estendido! 🎉',
        `Foram adicionados dias de degustação para o restaurante ${updated.nomeRestaurante}.\nNovo saldo: ${updated.diasRestantesTrial} dias.`
      );
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
      queryClient.setQueryData<TenantAdminItem[]>(['admin', 'tenants'], (old = []) =>
        old.map((t) => (t.restauranteId === updated.restauranteId ? updated : t))
      );
      AppDialog.success(
        'Status Atualizado! 🔒',
        `Assinatura do restaurante ${updated.nomeRestaurante} alterada para status: ${updated.statusAssinatura}.`
      );
    },
    onError: (err: Error) => {
      AppDialog.error('Erro na Operação', err.message);
    },
  });

  return {
    tenants,
    isLoading,
    refetch,
    estenderTrial: estenderMutation.mutate,
    isEstendendo: estenderMutation.isPending,
    alterarStatus: alterarStatusMutation.mutate,
    isAlterando: alterarStatusMutation.isPending,
  };
}
