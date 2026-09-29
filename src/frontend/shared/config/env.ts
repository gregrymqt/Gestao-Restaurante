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
declare const __DEV__: boolean | undefined;

function getDynamicHostUrl(): string | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants').default;
    const hostUri = Constants?.expoConfig?.hostUri;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host && host.trim().length > 0) {
        return `http://${host}:5287/api/v1`;
      }
    }
  } catch {
    // Silencioso em ambientes onde expo-constants não está vinculado
  }
  return undefined;
}

export function loadEnvConfig(customApiUrl?: string): AppEnvConfig {
  const dynamicDevUrl =
    typeof __DEV__ !== 'undefined' && __DEV__
      ? getDynamicHostUrl()
      : undefined;

  const apiUrl = customApiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? dynamicDevUrl;

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
