import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore, RestauranteTenant, TENANTS_PADRAO } from '@/features/auth';
import { useSseStatus } from '@/shared/hooks/useSseStatus';
import { perfilService } from '../services/perfilService';
import { ShiftMetrics, TerminalStatus } from '../types';

export function usePerfil() {
  const router = useRouter();
  const operador = useAuthStore((state) => state.operador);
  const currentTenant = useAuthStore((state) => state.tenant);
  const setTenant = useAuthStore((state) => state.setTenant);
  const logout = useAuthStore((state) => state.logout);

  const sseStatus = useSseStatus((state) => state.status);
  const isSseConnected = sseStatus === 'CONNECTED';

  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [metricas, setMetricas] = useState<ShiftMetrics | null>(null);
  const [terminalStatus, setTerminalStatus] = useState<TerminalStatus | null>(null);

  const availableTenants: RestauranteTenant[] =
    operador?.restaurantesVinculados && operador.restaurantesVinculados.length > 0
      ? operador.restaurantesVinculados
      : TENANTS_PADRAO;

  useEffect(() => {
    perfilService.obterMetricasTurno().then(setMetricas);
    perfilService.obterStatusTerminal(isSseConnected).then(setTerminalStatus);
  }, [isSseConnected]);

  const handleEncerrarTurno = () => {
    Alert.alert(
      'Encerrar Turno & Sair',
      'Deseja fechar o caixa e sincronizar os registros fiscais antes de finalizar o turno local?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar & Sair',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleBloquearTela = () => {
    Alert.alert(
      'Bloqueio do Terminal',
      'Terminal temporariamente bloqueado para segurança operacional.',
      [
        { text: 'Continuar no Turno', style: 'cancel' },
        {
          text: 'Trocar Operador',
          onPress: () => {
            logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleNavegarCaixa = () => {
    router.push('/(tabs)/caixa');
  };

  const handleSelectTenant = (tenant: RestauranteTenant) => {
    setTenant(tenant);
    setIsTenantModalOpen(false);
  };

  return {
    operador,
    currentTenant,
    availableTenants,
    isSseConnected,
    metricas,
    terminalStatus,
    isTenantModalOpen,
    setIsTenantModalOpen,
    handleSelectTenant,
    handleEncerrarTurno,
    handleBloquearTela,
    handleNavegarCaixa,
  };
}
