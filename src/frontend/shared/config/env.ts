/**
 * Interface estritamente tipada com as configurações e variáveis de ambiente do aplicativo móvel.
 */
export interface AppEnvConfig {
  readonly apiUrl: string;
  readonly isDevelopment: boolean;
  readonly isProduction: boolean;
}

/**
 * Orquestrador e validador Fail-Fast de variáveis de ambiente.
 * Se 'EXPO_PUBLIC_API_URL' não estiver definida no .env ou no ambiente, lança uma exceção fatal imediata.
 */
export function loadEnvConfig(customApiUrl?: string): AppEnvConfig {
  const apiUrl = customApiUrl ?? process.env.EXPO_PUBLIC_API_URL;

  if (!apiUrl || typeof apiUrl !== 'string' || apiUrl.trim().length === 0) {
    throw new Error(
      '[ENV_FAIL_FAST] VIOLAÇÃO CRÍTICA DE CONFIGURAÇÃO: A variável de ambiente "EXPO_PUBLIC_API_URL" não foi encontrada no .env ou no bundle. O aplicativo móvel não pode ser inicializado sem um endpoint de backend válido.'
    );
  }

  const normalizedUrl = apiUrl.trim().replace(/\/+$/, '');
  const nodeEnv = process.env.NODE_ENV || 'development';

  return Object.freeze({
    apiUrl: normalizedUrl,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
  });
}

/**
 * Instância singleton imutável exposta para todo o frontend.
 * Os serviços consomem exclusivamente esta instância, banindo 'process.env' de componentes e serviços.
 */
export const env: AppEnvConfig = loadEnvConfig();
