export interface RestauranteTenant {
  id: string;
  nome: string;
  cnpj: string;
  filialNumero: string;
  ativo: boolean;
}

export interface OperadorRecente {
  id: string;
  nome: string;
  matricula: string;
  fotoUrl?: string;
  email: string;
  iniciais?: string;
}

export interface LoginInput {
  identificador: string; // e-mail ou matrícula
  palavraPasse: string;  // PIN de 6 dígitos ou alfanumérico
  restauranteId: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiracao: string;
  operador: {
    id: string;
    nome: string;
    email: string;
    cargo: string;
    restaurantesVinculados: RestauranteTenant[];
  };
}

export interface AuthState {
  token: string | null;
  refreshToken: string | null;
  tenant: RestauranteTenant | null;
  operador: OperadorRecente | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setSession: (session: {
    token: string;
    refreshToken: string;
    tenant: RestauranteTenant;
    operador: OperadorRecente;
  }) => void;
  setTenant: (tenant: RestauranteTenant) => void;
  logout: () => void;
  initSessionFromStorage: () => void;
}
