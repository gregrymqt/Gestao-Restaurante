// ==============================================================================
// Manual Canónico de React Native: Expo SDK 54+
// Cliente de Rede Centralizado, Storage Síncrono MMKV e Polling TanStack Query
// ==============================================================================

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { MMKV } from 'react-native-mmkv';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ------------------------------------------------------------------------------
// 1. Armazenamento Síncrono de Alta Performance (Substitui AsyncStorage)
// ------------------------------------------------------------------------------
export const appStorage = new MMKV({
  id: 'restaurante-inteligente-storage',
  encryptionKey: 'chave-segura-restaurante'
});

export const StorageKeys = {
  AUTH_TOKEN: 'auth_jwt_token',
  RESTAURANTE_ID: 'auth_restaurante_id',
  USUARIO_DATA: 'auth_user_info'
} as const;

// ------------------------------------------------------------------------------
// 2. Cliente Axios com Interceptors Centrais
// ------------------------------------------------------------------------------
export const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.restauranteinteligente.io/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// Interceptor para injeção automática e síncrona do Token JWT
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = appStorage.getString(StorageKeys.AUTH_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// ------------------------------------------------------------------------------
// 3. Contratos TypeScript (Espelhando DTOs do Backend C#)
// ------------------------------------------------------------------------------
export interface PagedResult<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
}

export interface MovimentacaoResumoDto {
  readonly id: string;
  readonly tipo: 'Entrada' | 'Saida' | 'Ajuste';
  readonly quantidade: number;
  readonly dataHora: string;
  readonly origem: 'Venda' | 'Compra' | 'Inventario' | 'Descarte';
}

export interface PrevisaoProdutoItemDto {
  readonly produtoId: string;
  readonly demandaPrevista: number;
}

export interface PrevisaoDemandaResponseDto {
  readonly correlationId: string;
  readonly restauranteId: string;
  readonly status: 'PROCESSANDO' | 'CONCLUIDO' | 'FALHA';
  readonly dataPrevisao: string;
  readonly modeloVersao: string;
  readonly baselineDemanda: number;
  readonly previsoes: readonly PrevisaoProdutoItemDto[];
}

// ------------------------------------------------------------------------------
// 4. Hook de Polling Resiliente para Previsões de ML via TanStack Query
// ------------------------------------------------------------------------------
export function usePrevisaoDemandaPolling(correlationId: string | null) {
  return useQuery<PrevisaoDemandaResponseDto, AxiosError>({
    queryKey: ['previsao-demanda', correlationId],
    queryFn: async () => {
      if (!correlationId) throw new Error('CorrelationId não informado');
      const response = await apiClient.get<PrevisaoDemandaResponseDto>(`/previsoes/${correlationId}`);
      return response.data;
    },
    enabled: Boolean(correlationId),
    // Polling inteligente: consulta a cada 2.5 segundos enquanto estiver em 'PROCESSANDO'
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.status === 'PROCESSANDO') {
        return 2500; // Repete consulta
      }
      return false; // Interrompe polling assim que transitar para 'CONCLUIDO' ou 'FALHA'
    },
    refetchIntervalInBackground: false,
    staleTime: 1000 * 60 * 5, // Cache válido por 5 minutos após conclusão
    retry: (failureCount, error) => {
      // Não repete em erros 404 definitivos
      if (error.response?.status === 404) return false;
      return failureCount < 3;
    }
  });
}
