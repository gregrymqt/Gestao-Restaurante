import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AppDialog } from '@/shared/components/AppDialog';
import { authService } from '../services/authService';
import { useAuthStore } from './useAuthStore';
import { CadastrarRestauranteInput, OperadorRecente } from '../types';

export function useCadastroRestauranteMutation() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (input: CadastrarRestauranteInput) => authService.cadastrarRestaurante(input),
    onSuccess: (data) => {
      const operadorFormatado: OperadorRecente = {
        id: data.operador.id,
        nome: data.operador.nome,
        email: data.operador.email,
        matricula: 'OWNER-01',
        iniciais: data.operador.nome
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase(),
        restaurantesVinculados: data.operador.restaurantesVinculados,
      };

      setSession({
        token: data.token,
        refreshToken: data.refreshToken,
        tenant: data.operador.restaurantesVinculados[0],
        operador: operadorFormatado,
      });

      AppDialog.success(
        'Restaurante Cadastrado com Sucesso! 🎉',
        `Seja muito bem-vindo ao Restaurante Inteligente!\n\nVocê ganhou 14 dias de degustação gratuita sem restrições. Aproveite todos os recursos preditivos e inteligência artificial!`
      );

      router.replace('/(tabs)');
    },
    onError: (err: Error) => {
      AppDialog.error('Erro no Cadastro', err.message);
    },
  });
}
