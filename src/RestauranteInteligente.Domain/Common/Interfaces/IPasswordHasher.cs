namespace RestauranteInteligente.Domain.Common.Interfaces;

/// <summary>
/// Contrato criptográfico para hashing e validação segura de senhas.
/// </summary>
public interface IPasswordHasher
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string passwordHash);
}
