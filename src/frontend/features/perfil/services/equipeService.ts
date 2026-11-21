import { apiClient, extractErrorMessage, isCancel } from '@/services/api';

export interface ColaboradorEquipe {
  id: string;
  nome: string;
  email?: string;
  role: string;
  iniciais: string;
  ativo: boolean;
  possuiPin: boolean;
}

export interface CriarOperadorInput {
  nome: string;
  email?: string;
  role: 'Operator' | 'Manager';
  pin: string;
}

export const equipeService = {
  async listarEquipe(signal?: AbortSignal): Promise<ColaboradorEquipe[]> {
    try {
      const response = await apiClient.get<ColaboradorEquipe[]>('/equipe', { signal });
      return response.data || [];
    } catch (err: unknown) {
      if (isCancel(err)) throw err;
      throw new Error(extractErrorMessage(err, 'Não foi possível carregar a lista de colaboradores.'));
    }
  },

  async cadastrarOperador(
    input: CriarOperadorInput,
    signal?: AbortSignal
  ): Promise<ColaboradorEquipe> {
    try {
      const response = await apiClient.post<ColaboradorEquipe>(
        '/equipe',
        {
          nome: input.nome.trim(),
          email: input.email?.trim() || undefined,
          role: input.role,
          pin: input.pin.trim(),
        },
        { signal }
      );
      return response.data;
    } catch (err: unknown) {
      if (isCancel(err)) throw err;
      throw new Error(extractErrorMessage(err, 'Falha ao cadastrar colaborador na equipe.'));
    }
  },

  async desativarOperador(id: string, signal?: AbortSignal): Promise<void> {
    try {
      await apiClient.patch(`/equipe/${id}/desativar`, undefined, { signal });
    } catch (err: unknown) {
      if (isCancel(err)) throw err;
      throw new Error(extractErrorMessage(err, 'Não foi possível desativar o colaborador.'));
    }
  },

  async ativarOperador(id: string, signal?: AbortSignal): Promise<void> {
    try {
      await apiClient.patch(`/equipe/${id}/ativar`, undefined, { signal });
    } catch (err: unknown) {
      if (isCancel(err)) throw err;
      throw new Error(extractErrorMessage(err, 'Não foi possível reativar o colaborador.'));
    }
  },
};
