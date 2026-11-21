import { apiClient, extractErrorMessage } from '@/services/api';

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
  async listarEquipe(): Promise<ColaboradorEquipe[]> {
    try {
      const response = await apiClient.get<ColaboradorEquipe[]>('/equipe');
      return response.data || [];
    } catch (err: unknown) {
      throw new Error(extractErrorMessage(err, 'Não foi possível carregar a lista de colaboradores.'));
    }
  },

  async cadastrarOperador(input: CriarOperadorInput): Promise<ColaboradorEquipe> {
    try {
      const response = await apiClient.post<ColaboradorEquipe>('/equipe', {
        nome: input.nome.trim(),
        email: input.email?.trim() || undefined,
        role: input.role,
        pin: input.pin.trim(),
      });
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractErrorMessage(err, 'Falha ao cadastrar colaborador na equipe.'));
    }
  },

  async desativarOperador(id: string): Promise<void> {
    try {
      await apiClient.patch(`/equipe/${id}/desativar`);
    } catch (err: unknown) {
      throw new Error(extractErrorMessage(err, 'Não foi possível desativar o colaborador.'));
    }
  },

  async ativarOperador(id: string): Promise<void> {
    try {
      await apiClient.patch(`/equipe/${id}/ativar`);
    } catch (err: unknown) {
      throw new Error(extractErrorMessage(err, 'Não foi possível reativar o colaborador.'));
    }
  },
};
