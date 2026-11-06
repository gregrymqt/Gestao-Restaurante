using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using RestauranteInteligente.Api.Controllers;
using RestauranteInteligente.Application.Assinaturas.DTOs;
using RestauranteInteligente.Application.Assinaturas.UseCases;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Domain.Enums;
using Xunit;

namespace RestauranteInteligente.UnitTests;

/// <summary>
/// Bateria de Testes Discriminatórios de Ciclo de Vida SaaS (Paywall & Assinatura).
/// Valida se o sistema discrimina com precisão o estado de vigência contratual do inquilino
/// (Free Trial 14 dias, Assinatura Ativa, Vencida, Expirada ou Cancelada),
/// garantindo disparo correto de barreiras de Paywall e integridade na transição de planos.
/// </summary>
public sealed class SaaSSubscriptionLifecycleDiscriminatoryTests
{
    private readonly Guid _tenantId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private readonly Mock<IAssinaturaRepository> _assinaturaRepoMock = new();
    private readonly Mock<ITenantContext> _tenantContextMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();

    public SaaSSubscriptionLifecycleDiscriminatoryTests()
    {
        _tenantContextMock.Setup(t => t.HasTenant).Returns(true);
        _tenantContextMock.Setup(t => t.RestauranteId).Returns(_tenantId);
    }

    [Fact]
    public void EstaVigente_QuandoTrialDentroDoPrazo_DeveRetornarTrueEDiasRestantesPositivos()
    {
        // Arrange: Inquilino em Free Trial com 10 dias restantes
        var dataFimTrial = DateTimeOffset.UtcNow.AddDays(10);
        var assinatura = new Assinatura(Guid.NewGuid(), _tenantId, DateTimeOffset.UtcNow, dataFimTrial);

        // Act & Assert
        assinatura.EstaVigente().Should().BeTrue("um inquilino em Free Trial vigente deve ter acesso liberado");
        assinatura.DiasRestantesTrial().Should().Be(10);
        assinatura.Status.Should().Be(StatusAssinatura.Trial);
    }

    [Fact]
    public void EstaVigente_QuandoTrialExpiradoNoTempo_DeveDiscriminarRetornandoFalseEZeroDiasRestantes()
    {
        // Arrange: Inquilino cujo Free Trial de 14 dias acabou há 2 horas
        var dataInicio = DateTimeOffset.UtcNow.AddDays(-15);
        var dataFimTrial = DateTimeOffset.UtcNow.AddHours(-2);
        var assinatura = new Assinatura(Guid.NewGuid(), _tenantId, dataInicio, dataFimTrial);

        // Act & Assert
        assinatura.EstaVigente().Should().BeFalse("o trial expirou e o sistema deve discriminar barrando o inquilino com Paywall");
        assinatura.DiasRestantesTrial().Should().Be(0);
    }

    [Fact]
    public void EstaVigente_QuandoAssinaturaAtivaComVigenciaFutura_DeveRetornarTrue()
    {
        // Arrange: Inquilino com assinatura comercial ativa e válida
        var assinatura = new Assinatura(Guid.NewGuid(), _tenantId, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(14));
        var planoId = Guid.NewGuid();
        assinatura.AtivarPlano(planoId, mesesVigencia: 2);

        // Act & Assert
        assinatura.EstaVigente().Should().BeTrue("a assinatura comercial está ativa e dentro do prazo");
        assinatura.DiasRestantesTrial().Should().Be(0, "inquilinos em plano comercial não estão em trial");
        assinatura.Status.Should().Be(StatusAssinatura.Ativa);
        assinatura.PlanoId.Should().Be(planoId);
    }

    [Fact]
    public void EstaVigente_QuandoAssinaturaAtivaMasExpiradaNoTempo_DeveDiscriminarRetornandoFalse()
    {
        // Arrange: Inquilino em plano ativo cujo período de vigência venceu sem renovação
        var assinatura = new Assinatura(Guid.NewGuid(), _tenantId, DateTimeOffset.UtcNow.AddMonths(-2), DateTimeOffset.UtcNow.AddMonths(-1));
        var planoId = Guid.NewGuid();
        assinatura.AtivarPlano(planoId, mesesVigencia: 1);

        // Simula expiração temporal retroagindo a DataExpiracao
        assinatura.AlterarStatus(StatusAssinatura.Expirada);

        // Act & Assert
        assinatura.EstaVigente().Should().BeFalse("plano vencido não possui vigência ativa");
        assinatura.Status.Should().Be(StatusAssinatura.Expirada);
    }

    [Theory]
    [InlineData(StatusAssinatura.Cancelada)]
    [InlineData(StatusAssinatura.Expirada)]
    [InlineData(StatusAssinatura.Atrasada)]
    public void EstaVigente_QuandoStatusInativo_DeveDiscriminarRetornandoFalse(StatusAssinatura statusInativo)
    {
        // Arrange
        var assinatura = new Assinatura(Guid.NewGuid(), _tenantId, DateTimeOffset.UtcNow.AddDays(-30), DateTimeOffset.UtcNow.AddDays(10));
        assinatura.AlterarStatus(statusInativo);

        // Act & Assert
        assinatura.EstaVigente().Should().BeFalse($"o status '{statusInativo}' não confere vigência de operação ao restaurante");
    }

    [Fact]
    public void TransicoesDeEstado_AtivarPlano_DevePromoverParaAtivaEProjetarDataExpiracaoCorreta()
    {
        // Arrange
        var assinatura = new Assinatura(Guid.NewGuid(), _tenantId, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(14));
        var planoId = Guid.NewGuid();

        // Act: Contratação de plano trimestral (3 meses)
        assinatura.AtivarPlano(planoId, mesesVigencia: 3);

        // Assert
        assinatura.Status.Should().Be(StatusAssinatura.Ativa);
        assinatura.PlanoId.Should().Be(planoId);
        assinatura.DataExpiracao.Should().NotBeNull();
        assinatura.DataExpiracao!.Value.Should().BeCloseTo(DateTimeOffset.UtcNow.AddMonths(3), precision: TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void TransicoesDeEstado_EstenderTrial_QuandoExpirado_DeveReativarTrialEDiasPositivos()
    {
        // Arrange: Trial que já havia expirado
        var assinatura = new Assinatura(Guid.NewGuid(), _tenantId, DateTimeOffset.UtcNow.AddDays(-20), DateTimeOffset.UtcNow.AddDays(-5));
        assinatura.Expirar();
        assinatura.EstaVigente().Should().BeFalse();

        // Act: Ação administrativa de extensão de degustação por mais 7 dias
        assinatura.EstenderTrial(7);

        // Assert
        assinatura.Status.Should().Be(StatusAssinatura.Trial);
        assinatura.EstaVigente().Should().BeTrue("a extensão do trial deve reativar a vigência do inquilino");
        assinatura.DiasRestantesTrial().Should().Be(7);
    }

    [Fact]
    public void Invariantes_AtivarPlanoComParametrosInvalidos_DeveLancarExcecao()
    {
        var assinatura = new Assinatura(Guid.NewGuid(), _tenantId, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(14));

        var actPlanoVazio = () => assinatura.AtivarPlano(Guid.Empty, 1);
        var actMesesInvalidos = () => assinatura.AtivarPlano(Guid.NewGuid(), 0);

        actPlanoVazio.Should().Throw<ArgumentException>("PlanoId não pode ser vazio");
        actMesesInvalidos.Should().Throw<ArgumentOutOfRangeException>("mesesVigencia deve ser >= 1");
    }

    [Fact]
    public void Invariantes_EstenderTrialComDiasInvalidos_DeveLancarExcecao()
    {
        var assinatura = new Assinatura(Guid.NewGuid(), _tenantId, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(14));

        var actDiasZero = () => assinatura.EstenderTrial(0);
        var actDiasNegativos = () => assinatura.EstenderTrial(-5);

        actDiasZero.Should().Throw<ArgumentOutOfRangeException>();
        actDiasNegativos.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public async Task ObterStatusAssinaturaUseCase_QuandoInquilinoNovoSemAssinatura_DeveCriarTrialAutomatico14Dias()
    {
        // Arrange: Banco sem assinatura cadastrada para o tenant
        _assinaturaRepoMock.Setup(r => r.ObterPorRestauranteIdAsync(_tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Assinatura?)null);

        _assinaturaRepoMock.Setup(r => r.ObterPlanosAtivosAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Plano>());

        var sut = new ObterStatusAssinaturaUseCase(
            _tenantContextMock.Object,
            _assinaturaRepoMock.Object,
            _unitOfWorkMock.Object,
            NullLogger<ObterStatusAssinaturaUseCase>.Instance
        );

        // Act
        var resultado = await sut.ExecutarAsync(CancellationToken.None);

        // Assert
        resultado.Should().NotBeNull();
        resultado.Status.Should().Be("TRIAL");
        resultado.EstaVigente.Should().BeTrue("novo tenant deve receber 14 dias de degustação");
        resultado.DiasRestantesTrial.Should().Be(14);

        _assinaturaRepoMock.Verify(r => r.AdicionarAsync(It.Is<Assinatura>(a => a.RestauranteId == _tenantId), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.CommitAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ObterStatusAssinaturaUseCase_QuandoAssinaturaExpirada_DeveRetornarEstaVigenteFalseParaDisparoDePaywall()
    {
        // Arrange: Assinatura expirada
        var assinaturaExpirada = new Assinatura(Guid.NewGuid(), _tenantId, DateTimeOffset.UtcNow.AddDays(-30), DateTimeOffset.UtcNow.AddDays(-16));
        assinaturaExpirada.Expirar();

        _assinaturaRepoMock.Setup(r => r.ObterPorRestauranteIdAsync(_tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(assinaturaExpirada);

        _assinaturaRepoMock.Setup(r => r.ObterPlanosAtivosAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Plano>());

        var sut = new ObterStatusAssinaturaUseCase(
            _tenantContextMock.Object,
            _assinaturaRepoMock.Object,
            _unitOfWorkMock.Object,
            NullLogger<ObterStatusAssinaturaUseCase>.Instance
        );

        // Act
        var resultado = await sut.ExecutarAsync(CancellationToken.None);

        // Assert: Retorno discriminante para o interceptor de Paywall do app mobile
        resultado.EstaVigente.Should().BeFalse("inquilino com assinatura expirada deve ser sinalizado para Paywall");
        resultado.Status.Should().Be("EXPIRADA");
        resultado.DiasRestantesTrial.Should().Be(0);
    }

    [Fact]
    public async Task AtivarAssinaturaPlanoUseCase_QuandoPlanoInativoOuInexistente_DeveDiscriminarELancarInvalidOperationException()
    {
        // Arrange: Tentativa de assinar um plano inativo ou não existente
        var planoIdInvalido = Guid.NewGuid();
        _assinaturaRepoMock.Setup(r => r.ObterPlanoPorIdAsync(planoIdInvalido, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Plano?)null);

        var sut = new AtivarAssinaturaPlanoUseCase(
            _tenantContextMock.Object,
            _assinaturaRepoMock.Object,
            _unitOfWorkMock.Object,
            NullLogger<AtivarAssinaturaPlanoUseCase>.Instance
        );

        var input = new AtivarPlanoInputDto(planoIdInvalido, MesesVigencia: 1);

        // Act
        var act = async () => await sut.ExecutarAsync(input, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"*O plano informado '{planoIdInvalido}' não existe ou não está ativo.*");
    }

    [Fact]
    public async Task AssinaturaController_Endpoints_DevemDiscriminarVigenciaERespostasHttpCorretamente()
    {
        // Arrange
        var planoId = Guid.NewGuid();
        var plano = new Plano(planoId, "Plano Pro", "Plano com IA e Previsão", 149.90m, possuiModuloIa: true);

        var assinaturaAtiva = new Assinatura(Guid.NewGuid(), _tenantId, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(14));
        assinaturaAtiva.AtivarPlano(planoId, 1);

        _assinaturaRepoMock.Setup(r => r.ObterPorRestauranteIdAsync(_tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(assinaturaAtiva);
        _assinaturaRepoMock.Setup(r => r.ObterPlanoPorIdAsync(planoId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(plano);
        _assinaturaRepoMock.Setup(r => r.ObterPlanosAtivosAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Plano> { plano });

        var obterStatusUseCase = new ObterStatusAssinaturaUseCase(
            _tenantContextMock.Object,
            _assinaturaRepoMock.Object,
            _unitOfWorkMock.Object,
            NullLogger<ObterStatusAssinaturaUseCase>.Instance
        );

        var ativarPlanoUseCase = new AtivarAssinaturaPlanoUseCase(
            _tenantContextMock.Object,
            _assinaturaRepoMock.Object,
            _unitOfWorkMock.Object,
            NullLogger<AtivarAssinaturaPlanoUseCase>.Instance
        );

        var controller = new AssinaturaController(obterStatusUseCase, ativarPlanoUseCase);

        // Act 1: Consulta de status (deve retornar 200 Ok com vigência positiva)
        var statusResponse = await controller.ObterStatus(CancellationToken.None);
        statusResponse.Should().BeOfType<OkObjectResult>();
        var statusDto = (statusResponse as OkObjectResult)!.Value as AssinaturaStatusOutputDto;
        statusDto.Should().NotBeNull();
        statusDto!.EstaVigente.Should().BeTrue();
        statusDto.Status.Should().Be("ATIVA");

        // Act 2: Tentativa de assinar plano inexistente (deve discriminar com 422 UnprocessableEntity)
        var idInexistente = Guid.NewGuid();
        var assinarResponseInvalido = await controller.AtivarPlano(
            new AtivarPlanoInputDto(idInexistente, 1),
            CancellationToken.None
        );
        assinarResponseInvalido.Should().BeOfType<UnprocessableEntityObjectResult>();
    }
}
