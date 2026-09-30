import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppDialog } from '@/shared/components/AppDialog';
import { assinaturaService, ASSINATURA_PADRAO } from '../services/assinaturaService';
import { AssinaturaStatus } from '../types';

export function useAssinatura() {
  const queryClient = useQueryClient();

  const {
    data: assinatura = ASSINATURA_PADRAO,
    isLoading,
    refetch,
  } = useQuery<AssinaturaStatus>({
    queryKey: ['assinatura', 'status'],
    queryFn: () => assinaturaService.obterStatus(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const { mutate: assinarPlano, isPending: isAssinando } = useMutation({
    mutationFn: (planoId: string) => assinaturaService.assinarPlano(planoId),
    onSuccess: (data) => {
      queryClient.setQueryData(['assinatura', 'status'], data);
      queryClient.invalidateQueries({ queryKey: ['assinatura'] });
      AppDialog.success(
        'Assinatura Ativada! 🎉',
        `Parabéns! O seu restaurante agora está no plano ${data.planoAtual?.nome || 'Pro'}.\nTodos os módulos avançados e inteligência artificial estão 100% liberados!`
      );
    },
    onError: (err: Error) => {
      AppDialog.error('Erro na Assinatura', err.message);
    },
  });

  return {
    assinatura,
    isLoading,
    refetch,
    assinarPlano,
    isAssinando,
  };
}
