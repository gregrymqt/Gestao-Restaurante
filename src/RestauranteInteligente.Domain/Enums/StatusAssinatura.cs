namespace RestauranteInteligente.Domain.Enums;

/// <summary>
/// Ciclo de vida e estado de vigência da assinatura do inquilino (Tenant) no modelo SaaS.
/// </summary>
public enum StatusAssinatura
{
    Trial = 1,
    Ativa = 2,
    Atrasada = 3,
    Expirada = 4,
    Cancelada = 5
}
