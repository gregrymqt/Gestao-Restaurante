namespace RestauranteInteligente.Infrastructure.Security;

/// <summary>
/// Opções de configuração para autenticação, emissão e ciclo de vida de tokens JWT e Refresh Tokens.
/// </summary>
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "RestauranteInteligente";
    public string Audience { get; set; } = "RestauranteInteligente.App";
    public string Key { get; set; } = string.Empty;
    public int ExpirationMinutes { get; set; } = 15; // 15 minutos (janela curta e higiênica)
    public int RefreshTokenExpirationDays { get; set; } = 7; // 7 dias de persistência para a sessão
}
