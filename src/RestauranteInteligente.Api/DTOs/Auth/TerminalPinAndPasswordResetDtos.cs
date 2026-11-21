namespace RestauranteInteligente.Api.DTOs.Auth;

/// <summary>
/// DTO para solicitação de validação do PIN de 4 a 6 dígitos no terminal do operador.
/// </summary>
public sealed record ValidarPinRequest(string Pin);

/// <summary>
/// DTO para definição ou alteração do PIN de terminal do operador autenticado.
/// </summary>
public sealed record DefinirPinRequest(string NovoPin);

/// <summary>
/// DTO para solicitação de código de recuperação de senha por e-mail corporativo.
/// </summary>
public sealed record EsqueciSenhaRequest(string Email);

/// <summary>
/// DTO para validação de OTP e redefinição final de senha do usuário.
/// </summary>
public sealed record RedefinirSenhaRequest(string Email, string CodigoOtp, string NovaSenha);
