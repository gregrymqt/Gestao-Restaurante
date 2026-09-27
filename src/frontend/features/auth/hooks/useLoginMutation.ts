import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { authService } from '../services/authService';
import { useAuthStore } from './useAuthStore';
import { LoginInput, LoginResponse } from '../types';

export function useLoginMutation() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const currentTenant = useAuthStore((state) => state.tenant);

  return useMutation<LoginResponse, Error, LoginInput>({
    mutationFn: (input) => authService.login(input),
    onSuccess: (data, variables) => {
      const activeTenant =
        data.operador.restaurantesVinculados.find((t) => t.id === variables.restauranteId) ||
        currentTenant ||
        data.operador.restaurantesVinculados[0];

      setSession({
        token: data.token,
        refreshToken: data.refreshToken,
        tenant: activeTenant,
        operador: {
          id: data.operador.id,
          nome: data.operador.nome,
          email: data.operador.email,
          matricula: variables.identificador.replace(/\D/g, '') || '05829',
          iniciais: data.operador.nome
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase(),
        },
      });

      // Transição fluida e segura para o balcão operacional (tabs)
      router.replace('/(tabs)');
    },
  });
}
