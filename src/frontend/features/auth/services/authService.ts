import { apiClient } from '@/shared/services/api';
import {
  RestauranteTenant,
  OperadorRecente,
  LoginInput,
  CadastrarRestauranteInput,
  LoginResponse,
} from '../types';

export const TENANTS_PADRAO: RestauranteTenant[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nome: 'Restaurante Teste E2E',
    cnpj: '12.345.678/0001-90',
    filialNumero: 'Filial #01',
    ativo: true,
  },
];

export const OPERADORES_RECENTES_PADRAO: OperadorRecente[] = [
  {
    id: '99999999-9999-9999-9999-999999999999',
    nome: 'Operador Homologação',
    matricula: '05829',
    email: 'operador@restaurante.com',
    fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
    iniciais: 'OH',
  },
];

export const authService = {
  async obterTenants(): Promise<RestauranteTenant[]> {
    try {
      const response = await apiClient.get<RestauranteTenant[]>('/auth/tenants');
      return response.data;
    } catch {
      return TENANTS_PADRAO;
    }
  },

  async obterOperadoresRecentes(): Promise<OperadorRecente[]> {
    return OPERADORES_RECENTES_PADRAO;
  },

  async login(input: LoginInput): Promise<LoginResponse> {
    const isGuid = (val?: string) =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    try {
      const response = await apiClient.post<any>('/auth/login', {
        email: input.identificador.includes('@')
          ? input.identificador.trim().toLowerCase()
          : 'operador@restaurante.com',
        password: input.palavraPasse,
        restauranteId: isGuid(input.restauranteId) ? input.restauranteId : undefined,
      });

      const backendData = response.data;
      const tenantId =
        backendData.restauranteId || input.restauranteId || '11111111-1111-1111-1111-111111111111';
      const tenant =
        TENANTS_PADRAO.find((t) => t.id === tenantId) || {
          id: tenantId,
          nome: 'Restaurante Teste E2E',
          cnpj: '12.345.678/0001-90',
          filialNumero: 'Filial #01',
          ativo: true,
        };

      return {
        token: backendData.token,
        refreshToken: backendData.refreshToken,
        expiracao: backendData.expiresAt || new Date(Date.now() + 1000 * 60 * 15).toISOString(),
        operador: {
          id: backendData.userId || '99999999-9999-9999-9999-999999999999',
          nome: 'Operador Homologação',
          email: input.identificador.includes('@') ? input.identificador : 'operador@restaurante.com',
          cargo: 'Operador de Balcão & Caixa',
          restaurantesVinculados: [tenant],
        },
      };
    } catch (err: any) {
      const serverMessage =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.response?.data?.title ||
        err.message ||
        'Não foi possível autenticar junto ao servidor.';
      throw new Error(serverMessage);
    }
  },

  async cadastrarRestaurante(input: CadastrarRestauranteInput): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<any>('/auth/cadastrar-restaurante', {
        nomeRestaurante: input.nomeRestaurante.trim(),
        cnpj: input.cnpj.trim(),
        cidade: input.cidade?.trim() || 'São Paulo',
        estado: input.estado?.trim() || 'SP',
        latitude: -23.5505,
        longitude: -46.6333,
        nomeGestor: input.nomeGestor.trim(),
        emailGestor: input.emailGestor.trim().toLowerCase(),
        senhaGestor: input.senhaGestor,
      });

      const backendData = response.data;
      const tenant: RestauranteTenant = {
        id: backendData.restauranteId,
        nome: backendData.nomeRestaurante,
        cnpj: input.cnpj,
        filialNumero: 'Matriz (Trial 14d)',
        ativo: true,
      };

      return {
        token: backendData.token,
        refreshToken: backendData.refreshToken,
        expiracao: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
        operador: {
          id: backendData.usuarioId,
          nome: backendData.nomeGestor,
          email: backendData.email,
          cargo: 'Proprietário / Gestor',
          restaurantesVinculados: [tenant],
        },
      };
    } catch (err: any) {
      const serverMessage =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.message ||
        'Não foi possível cadastrar o restaurante. Tente novamente.';
      throw new Error(serverMessage);
    }
  },
};
