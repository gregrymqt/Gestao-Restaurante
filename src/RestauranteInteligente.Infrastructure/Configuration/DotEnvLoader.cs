using System.Text.RegularExpressions;

namespace RestauranteInteligente.Infrastructure.Configuration;

/// <summary>
/// Exceção lançada quando variáveis de ambiente mandatórias estão ausentes ou violam requisitos de segurança.
/// </summary>
public class EnvConfigurationException : InvalidOperationException
{
    public EnvConfigurationException(string message) : base(message) { }
}

/// <summary>
/// Carregador e orquestrador nativo do arquivo .env com validação rigorosa Fail-Fast.
/// Elimina a necessidade de appsettings.json para credenciais e variáveis dinâmicas do sistema.
/// </summary>
public static class DotEnvLoader
{
    private static readonly string[] RequiredKeys =
    [
        "ENVIRONMENT",
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
        "POSTGRES_DB",
        "POSTGRES_HOST",
        "POSTGRES_PORT",
        "REDIS_HOST",
        "REDIS_PORT",
        "REDIS_PASSWORD",
        "RABBITMQ_HOST",
        "RABBITMQ_PORT",
        "RABBITMQ_USER",
        "RABBITMQ_PASSWORD",
        "JWT_KEY",
        "JWT_ISSUER",
        "JWT_AUDIENCE"
    ];

    private static readonly Dictionary<string, string[]> KeyAliases = new(StringComparer.OrdinalIgnoreCase)
    {
        ["ENVIRONMENT"] = ["ASPNETCORE_ENVIRONMENT", "DOTNET_ENVIRONMENT"],
        ["POSTGRES_USER"] = ["Database:Username", "Database__Username"],
        ["POSTGRES_PASSWORD"] = ["Database:Password", "Database__Password"],
        ["POSTGRES_DB"] = ["Database:Database", "Database__Database"],
        ["POSTGRES_HOST"] = ["Database:Host", "Database__Host"],
        ["POSTGRES_PORT"] = ["Database:Port", "Database__Port"],
        ["REDIS_HOST"] = ["Redis:Host", "Redis__Host"],
        ["REDIS_PORT"] = ["Redis:Port", "Redis__Port"],
        ["REDIS_PASSWORD"] = ["Redis:Password", "Redis__Password"],
        ["REDIS_DB"] = ["Redis:Database", "Redis__Database"],
        ["RABBITMQ_HOST"] = ["RabbitMQ:Host", "RabbitMQ__Host"],
        ["RABBITMQ_PORT"] = ["RabbitMQ:Port", "RabbitMQ__Port"],
        ["RABBITMQ_USER"] = ["RabbitMQ:Username", "RabbitMQ__Username"],
        ["RABBITMQ_PASSWORD"] = ["RabbitMQ:Password", "RabbitMQ__Password"],
        ["JWT_KEY"] = ["Jwt:Key", "Jwt__Key"],
        ["JWT_ISSUER"] = ["Jwt:Issuer", "Jwt__Issuer"],
        ["JWT_AUDIENCE"] = ["Jwt:Audience", "Jwt__Audience"],
        ["JWT_EXPIRATION_MINUTES"] = ["Jwt:ExpirationMinutes", "Jwt__ExpirationMinutes"],
        ["JWT_REFRESH_EXPIRATION_DAYS"] = ["Jwt:RefreshTokenExpirationDays", "Jwt__RefreshTokenExpirationDays"],
        ["INTERNAL_SERVICE_API_KEY"] = ["Security:InternalServiceApiKey", "Security__InternalServiceApiKey"],
        ["MERCADO_PAGO_WEBHOOK_SECRET"] = ["Security:MercadoPagoWebhookSecret", "Security__MercadoPagoWebhookSecret"]
    };

    private static readonly Dictionary<string, string> AliasToPrimaryKey = BuildAliasMap();

    private static Dictionary<string, string> BuildAliasMap()
    {
        var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var (primary, aliases) in KeyAliases)
        {
            map[primary] = primary;
            foreach (var alias in aliases)
            {
                map[alias] = primary;
            }
        }
        return map;
    }

    /// <summary>
    /// Mescla overrides (ex: de testes ou IConfiguration) garantindo que mapeamentos de alias sobrescrevam as chaves primárias.
    /// </summary>
    public static void MergeOverrides(IDictionary<string, string?> target, IEnumerable<KeyValuePair<string, string?>> overrides)
    {
        foreach (var item in overrides)
        {
            if (string.IsNullOrEmpty(item.Key)) continue;

            target[item.Key] = item.Value;
            if (AliasToPrimaryKey.TryGetValue(item.Key, out var primaryKey))
            {
                target[primaryKey] = item.Value;
            }
        }
    }

    /// <summary>
    /// Localiza o arquivo .env, analisa as variáveis mesclando com variáveis do SO e valida o sistema com Fail-Fast.
    /// </summary>
    public static IAppEnvSettings Load(string? explicitEnvFilePath = null)
    {
        var envFilePath = explicitEnvFilePath ?? FindDotEnvFile();
        var fileVariables = envFilePath != null && File.Exists(envFilePath)
            ? ParseFile(envFilePath)
            : new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        // Mescla variáveis de ambiente do sistema operacional (têm precedência) com o arquivo .env
        var merged = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);

        foreach (var kvp in fileVariables)
        {
            merged[kvp.Key] = kvp.Value;
        }

        foreach (var key in RequiredKeys.Concat(new[]
        {
            "REDIS_DB",
            "JWT_EXPIRATION_MINUTES",
            "JWT_REFRESH_EXPIRATION_DAYS",
            "INTERNAL_SERVICE_API_KEY",
            "MERCADO_PAGO_WEBHOOK_SECRET",
            "ASPNETCORE_ENVIRONMENT",
            "DOTNET_ENVIRONMENT",
            "ConnectionStrings:DefaultConnection",
            "ConnectionStrings__DefaultConnection"
        }))
        {
            var osVal = Environment.GetEnvironmentVariable(key);
            if (!string.IsNullOrWhiteSpace(osVal))
            {
                merged[key] = osVal;
            }
        }

        return LoadFromDictionary(merged, envFilePath);
    }

    /// <summary>
    /// Valida e constrói a árvore de configuração tipada a partir de um dicionário (ideal para testes unitários).
    /// </summary>
    public static IAppEnvSettings LoadFromDictionary(IDictionary<string, string?> values, string? sourcePath = null)
    {
        // Se houver uma ConnectionString completa do PostgreSQL fornecida (ex: nos testes ou docker), desmembra se faltarem chaves individuais
        ExtractPostgresFromConnectionStringIfPresent(values);

        var missingKeys = new List<string>();
        var resolvedValues = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (var key in RequiredKeys)
        {
            var resolved = ResolveValue(values, key);
            if (string.IsNullOrWhiteSpace(resolved))
            {
                missingKeys.Add(key);
            }
            else
            {
                resolvedValues[key] = resolved.Trim();
            }
        }

        if (missingKeys.Count > 0)
        {
            var origin = sourcePath != null ? $"no arquivo '{sourcePath}' ou no ambiente do SO" : "no ambiente";
            throw new EnvConfigurationException(
                $"VIOLAÇÃO CRÍTICA DE CONFIGURAÇÃO (Fail-Fast): As seguintes variáveis de ambiente obrigatórias não foram encontradas {origin}:\n" +
                string.Join("\n", missingKeys.Select(k => $" - {k}")));
        }

        var environment = resolvedValues["ENVIRONMENT"];
        var isProduction = string.Equals(environment, "production", StringComparison.OrdinalIgnoreCase);

        // Validação de Segurança do JWT
        var jwtKey = resolvedValues["JWT_KEY"];
        if (jwtKey.Length < 32)
        {
            throw new EnvConfigurationException(
                "VIOLAÇÃO CRÍTICA DE SEGURANÇA (Fail-Fast): A chave 'JWT_KEY' (ou 'Jwt:Key') deve conter no mínimo 32 caracteres (256 bits). Forneça uma chave segura via variável de ambiente JWT__KEY.");
        }

        if (isProduction && (jwtKey.Contains("ChaveSecretaUltraSeguraRestauranteInteligente2026!#@$") ||
                             jwtKey.Contains("DevLocalOnlyKeyNotForProdUseSecure2026!#@$")))
        {
            throw new EnvConfigurationException(
                "VIOLAÇÃO CRÍTICA DE SEGURANÇA: Chave JWT default de exemplo detectada em ambiente de produção.");
        }

        // Validação de Segurança Interna em Produção
        var internalApiKey = ResolveValue(values, "INTERNAL_SERVICE_API_KEY");
        if (isProduction && string.IsNullOrWhiteSpace(internalApiKey))
        {
            throw new EnvConfigurationException(
                "VIOLAÇÃO CRÍTICA DE SEGURANÇA: A chave interna de serviço ('INTERNAL_SERVICE_API_KEY' ou 'Security:InternalServiceApiKey') é mandatória em produção.");
        }

        var mpSecret = ResolveValue(values, "MERCADO_PAGO_WEBHOOK_SECRET");

        // Database
        var dbPort = ParseIntOrDefault(resolvedValues["POSTGRES_PORT"], 5432, "POSTGRES_PORT");
        var databaseConfig = new DatabaseConfig(
            Host: resolvedValues["POSTGRES_HOST"],
            Port: dbPort,
            Database: resolvedValues["POSTGRES_DB"],
            Username: resolvedValues["POSTGRES_USER"],
            Password: resolvedValues["POSTGRES_PASSWORD"]
        );

        // Redis
        var redisPort = ParseIntOrDefault(resolvedValues["REDIS_PORT"], 6379, "REDIS_PORT");
        var redisDbStr = ResolveValue(values, "REDIS_DB");
        var redisDb = !string.IsNullOrWhiteSpace(redisDbStr) ? ParseIntOrDefault(redisDbStr, 0, "REDIS_DB") : 0;
        var redisConfig = new RedisConfig(
            Host: resolvedValues["REDIS_HOST"],
            Port: redisPort,
            Password: resolvedValues["REDIS_PASSWORD"],
            Database: redisDb
        );

        // RabbitMQ
        var rabbitPort = ParseIntOrDefault(resolvedValues["RABBITMQ_PORT"], 5672, "RABBITMQ_PORT");
        var rabbitConfig = new RabbitMqConfig(
            Host: resolvedValues["RABBITMQ_HOST"],
            Port: rabbitPort,
            Username: resolvedValues["RABBITMQ_USER"],
            Password: resolvedValues["RABBITMQ_PASSWORD"]
        );

        // JWT
        var jwtExpStr = ResolveValue(values, "JWT_EXPIRATION_MINUTES");
        var jwtExp = !string.IsNullOrWhiteSpace(jwtExpStr) ? ParseIntOrDefault(jwtExpStr, 15, "JWT_EXPIRATION_MINUTES") : 15;

        var jwtRefStr = ResolveValue(values, "JWT_REFRESH_EXPIRATION_DAYS");
        var jwtRefreshDays = !string.IsNullOrWhiteSpace(jwtRefStr) ? ParseIntOrDefault(jwtRefStr, 7, "JWT_REFRESH_EXPIRATION_DAYS") : 7;

        var jwtConfig = new JwtConfig(
            Key: jwtKey,
            Issuer: resolvedValues["JWT_ISSUER"],
            Audience: resolvedValues["JWT_AUDIENCE"],
            ExpirationMinutes: jwtExp,
            RefreshTokenExpirationDays: jwtRefreshDays
        );

        // Security
        var securityConfig = new SecurityConfig(
            InternalServiceApiKey: internalApiKey?.Trim() ?? string.Empty,
            MercadoPagoWebhookSecret: mpSecret?.Trim() ?? string.Empty
        );

        return new AppEnvSettings(
            Environment: environment,
            Database: databaseConfig,
            Redis: redisConfig,
            RabbitMq: rabbitConfig,
            Jwt: jwtConfig,
            Security: securityConfig
        );
    }

    private static string? ResolveValue(IDictionary<string, string?> values, string primaryKey)
    {
        if (values.TryGetValue(primaryKey, out var direct) && !string.IsNullOrWhiteSpace(direct))
        {
            return direct;
        }

        if (KeyAliases.TryGetValue(primaryKey, out var aliases))
        {
            foreach (var alias in aliases)
            {
                if (values.TryGetValue(alias, out var aliasVal) && !string.IsNullOrWhiteSpace(aliasVal))
                {
                    return aliasVal;
                }
            }
        }

        return null;
    }

    private static void ExtractPostgresFromConnectionStringIfPresent(IDictionary<string, string?> values)
    {
        string? connStr = null;
        if (values.TryGetValue("ConnectionStrings:DefaultConnection", out var cs1) && !string.IsNullOrWhiteSpace(cs1))
            connStr = cs1;
        else if (values.TryGetValue("ConnectionStrings__DefaultConnection", out var cs2) && !string.IsNullOrWhiteSpace(cs2))
            connStr = cs2;

        if (string.IsNullOrWhiteSpace(connStr))
            return;

        // Parse key=value pairs from connection string (Host=...;Port=...;Database=...;Username=...;Password=...)
        var parts = connStr.Split(';', StringSplitOptions.RemoveEmptyEntries);
        foreach (var part in parts)
        {
            var kv = part.Split('=', 2);
            if (kv.Length != 2) continue;
            var k = kv[0].Trim().ToLowerInvariant();
            var v = kv[1].Trim();

            if (k is "host" or "server" && !values.ContainsKey("POSTGRES_HOST"))
                values["POSTGRES_HOST"] = v;
            else if (k is "port" && !values.ContainsKey("POSTGRES_PORT"))
                values["POSTGRES_PORT"] = v;
            else if (k is "database" or "db" && !values.ContainsKey("POSTGRES_DB"))
                values["POSTGRES_DB"] = v;
            else if (k is "username" or "user id" or "uid" or "user" && !values.ContainsKey("POSTGRES_USER"))
                values["POSTGRES_USER"] = v;
            else if (k is "password" or "pwd" && !values.ContainsKey("POSTGRES_PASSWORD"))
                values["POSTGRES_PASSWORD"] = v;
        }
    }

    /// <summary>
    /// Percorre a árvore de diretórios ascendentemente até encontrar o arquivo .env na raiz do monorepo.
    /// </summary>
    public static string? FindDotEnvFile(string? startDirectory = null)
    {
        var currentDir = new DirectoryInfo(startDirectory ?? Directory.GetCurrentDirectory());

        while (currentDir != null && currentDir.Exists)
        {
            var candidate = Path.Combine(currentDir.FullName, ".env");
            if (File.Exists(candidate))
            {
                return candidate;
            }
            currentDir = currentDir.Parent;
        }

        var baseDir = new DirectoryInfo(AppContext.BaseDirectory);
        while (baseDir != null && baseDir.Exists)
        {
            var candidate = Path.Combine(baseDir.FullName, ".env");
            if (File.Exists(candidate))
            {
                return candidate;
            }
            baseDir = baseDir.Parent;
        }

        return null;
    }

    /// <summary>
    /// Analisa linha por linha o arquivo .env eliminando comentários (#) e delimitadores de aspas.
    /// </summary>
    public static Dictionary<string, string> ParseFile(string filePath)
    {
        var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (var rawLine in File.ReadAllLines(filePath))
        {
            var line = rawLine.Trim();

            if (string.IsNullOrWhiteSpace(line) || line.StartsWith('#'))
            {
                continue;
            }

            var separatorIndex = line.IndexOf('=');
            if (separatorIndex <= 0)
            {
                continue;
            }

            var key = line[..separatorIndex].Trim();
            var value = line[(separatorIndex + 1)..].Trim();

            if ((value.StartsWith('"') && value.EndsWith('"')) ||
                (value.StartsWith('\'') && value.EndsWith('\'')))
            {
                value = value[1..^1];
            }

            result[key] = value;
        }

        return result;
    }

    private static int ParseIntOrDefault(string? value, int defaultValue, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return defaultValue;
        }

        if (int.TryParse(value, out var parsed))
        {
            return parsed;
        }

        throw new EnvConfigurationException(
            $"VIOLAÇÃO CRÍTICA DE CONFIGURAÇÃO (Fail-Fast): O valor '{value}' do campo '{fieldName}' não é um número inteiro válido.");
    }
}
