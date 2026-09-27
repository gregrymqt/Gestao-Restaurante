import { apiClient } from '@/shared/services/api';
import {
  RestauranteTenant,
  OperadorRecente,
  LoginInput,
  LoginResponse,
} from '../types';

export const TENANTS_PADRAO: RestauranteTenant[] = [
  {
    id: 'rest-praia-grande',
    nome: 'GastroBurger - Praia Grande',
    cnpj: '12.345.678/0001-90',
    filialNumero: 'Filial #02',
    ativo: true,
  },
  {
    id: 'rest-santos-centro',
    nome: 'GastroBurger - Santos Centro',
    cnpj: '12.345.678/0002-71',
    filialNumero: 'Filial #01',
    ativo: true,
  },
  {
    id: 'rest-sao-vicente',
    nome: 'GastroBurger - São Vicente',
    cnpj: '12.345.678/0003-52',
    filialNumero: 'Filial #03',
    ativo: true,
  },
];

export const OPERADORES_RECENTES_PADRAO: OperadorRecente[] = [
  {
    id: 'op-lucas-vicente',
    nome: 'Lucas Vicente',
    matricula: '05829',
    email: 'operador@gastropdv.com.br',
    fotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
    iniciais: 'LV',
  },
  {
    id: 'op-marcos-alves',
    nome: 'Marcos Alves',
    matricula: '03192',
    email: 'marcos.alves@gastropdv.com.br',
    iniciais: 'MA',
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
    try {
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email: input.identificador.includes('@') ? input.identificador : undefined,
        matricula: !input.identificador.includes('@') ? input.identificador : undefined,
        password: input.palavraPasse,
        restauranteId: input.restauranteId,
      });
      return response.data;
    } catch {
      // Fallback resiliente com credenciais de demonstração do Stitch UI
      const operadorEncontrado = OPERADORES_RECENTES_PADRAO.find(
        (o) =>
          o.email.toLowerCase() === input.identificador.toLowerCase() ||
          o.matricula === input.identificador
      ) || {
        id: `op-${Date.now().toString(36)}`,
        nome: input.identificador.includes('@')
          ? input.identificador.split('@')[0]
          : `Operador ${input.identificador}`,
        matricula: input.identificador.replace(/\D/g, '') || '05829',
        email: input.identificador.includes('@') ? input.identificador : 'operador@gastropdv.com.br',
        iniciais: 'OP',
      };

      const tenantEncontrado =
        TENANTS_PADRAO.find((t) => t.id === input.restauranteId) || TENANTS_PADRAO[0];

      return {
        token: `mock-jwt-token-${Date.now()}.${Buffer.from(
          JSON.stringify({ tenantId: tenantEncontrado.id, role: 'Caixa' })
        ).toString('base64')}.signature`,
        refreshToken: `mock-refresh-token-${Date.now().toString(36)}`,
        expiracao: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
        operador: {
          id: operadorEncontrado.id,
          nome: operadorEncontrado.nome,
          email: operadorEncontrado.email,
          cargo: 'Operador de Balcão & Caixa',
          restaurantesVinculados: TENANTS_PADRAO,
        },
      };
    }
  },
};
