import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth';
import { dashboardService, DADOS_DASHBOARD_PADRAO } from '../services/dashboardService';
import { DashboardExecutivoData } from '../types';

export function useDashboardExecutivo() {
  const tenant = useAuthStore((state) => state.tenant);
  const operador = useAuthStore((state) => state.operador);

  const {
    data: dashboard = DADOS_DASHBOARD_PADRAO,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<DashboardExecutivoData>({
    queryKey: ['dashboard', 'executivo', tenant?.id],
    queryFn: () => dashboardService.obterResumoExecutivo(),
    staleTime: 5000, // 5 segundos para refletir alterações em tempo real
  });

  return {
    dashboard,
    isLoading: isLoading || isRefetching,
    refetch,
    tenant,
    operador,
  };
}
