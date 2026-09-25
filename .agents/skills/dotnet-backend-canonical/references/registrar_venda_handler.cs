// ==============================================================================
// Manual Canónico de Backend: ASP.NET Core (.NET 9 / C# 13)
// Caso de Uso Canônico: Registro de Venda com Baixa Anti-Deadlock e EventBus
// ==============================================================================

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RestauranteInteligente.Application.Common.Interfaces;
using RestauranteInteligente.Domain.Entities;
using RestauranteInteligente.Domain.Enums;
using RestauranteInteligente.Domain.Exceptions;

namespace RestauranteInteligente.Application.UseCases.Vendas;

#region Contratos do Comando

public sealed record RegistrarVendaCommand(
    Guid FechamentoCaixaId,
    string FormaPagamento,
    List<ItemVendaDto> Itens
) : IRequest<Guid>;

public sealed record ItemVendaDto(
    Guid ProdutoId,
    int Quantidade
);

public sealed record VendaRealizadaEvent(
    Guid VendaId,
    Guid RestauranteId,
    decimal ValorTotal,
    DateTimeOffset DataHora,
    List<ItemVendaPayload> Itens
);

public sealed record ItemVendaPayload(Guid ProdutoId, int Quantidade, decimal PrecoUnitario);

#endregion

#region Handler do Caso de Uso

public sealed class RegistrarVendaCommandHandler : IRequestHandler<RegistrarVendaCommand, Guid>
{
    private readonly IAppDbContext _context;
    private readonly IEventBus _eventBus;
    private readonly ICurrentTenantProvider _tenantProvider;

    public RegistrarVendaCommandHandler(
        IAppDbContext context,
        IEventBus eventBus,
        ICurrentTenantProvider tenantProvider)
    {
        _context = context;
        _eventBus = eventBus;
        _tenantProvider = tenantProvider;
    }

    public async Task<Guid> Handle(RegistrarVendaCommand request, CancellationToken cancellationToken)
    {
        var restauranteId = _tenantProvider.RestauranteId 
            ?? throw new UnauthorizedAccessException("Identificação do restaurante ausente na sessão ativa.");

        var executionStrategy = _context.Database.CreateExecutionStrategy();

        return await executionStrategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

            var produtoIds = request.Itens.Select(i => i.ProdutoId).Distinct().ToList();
            var produtos = await _context.Produtos
                .Include(p => p.ProdutosInsumos)
                .Where(p => produtoIds.Contains(p.Id))
                .ToListAsync(cancellationToken);

            if (produtos.Count != produtoIds.Count)
                throw new DomainValidationException("Um ou mais itens referenciados no pedido não constam no catálogo ativo.");

            // 1. Expandir a Ficha Técnica (BOM) e consolidar os consumos totais por insumo
            var insumosConsumidos = new Dictionary<Guid, decimal>();
            foreach (var item in request.Itens)
            {
                var produto = produtos.First(p => p.Id == item.ProdutoId);
                foreach (var composicao in produto.ProdutosInsumos)
                {
                    var volumeCalculado = composicao.Quantidade * item.Quantidade;
                    if (insumosConsumidos.ContainsKey(composicao.InsumoId))
                        insumosConsumidos[composicao.InsumoId] += volumeCalculado;
                    else
                        insumosConsumidos[composicao.InsumoId] = volumeCalculado;
                }
            }

            // 2. ORDENAÇÃO MANDATÓRIA ANTI-DEADLOCK:
            // Ordenar deterministicamente as chaves primárias em progressão ascendente
            var insumosOrdenadosIds = insumosConsumidos.Keys.OrderBy(id => id).ToArray();

            // 3. Bloqueio pessimista estrito via PostgreSQL 'FOR UPDATE' na mesma ordem
            var insumosPersistidos = await _context.Insumos
                .FromSqlRaw(
                    "SELECT * FROM \"Insumos\" WHERE \"Id\" = ANY({0}) AND \"RestauranteId\" = {1} ORDER BY \"Id\" FOR UPDATE",
                    insumosOrdenadosIds, restauranteId)
                .ToListAsync(cancellationToken);

            var venda = new Venda(restauranteId, request.FechamentoCaixaId, request.FormaPagamento);

            foreach (var item in request.Itens)
            {
                var prod = produtos.First(p => p.Id == item.ProdutoId);
                venda.AdicionarItem(prod.Id, item.Quantidade, prod.Preco);
            }

            // 4. Débito no estoque e geração das movimentações imutáveis no ledger
            foreach (var insumoId in insumosOrdenadosIds)
            {
                var insumo = insumosPersistidos.FirstOrDefault(i => i.Id == insumoId)
                    ?? throw new InvalidOperationException($"Insumo com ID '{insumoId}' não encontrado para baixa.");

                var consumoNecessario = insumosConsumidos[insumoId];

                // Valida e debita o saldo via método de domínio rico
                insumo.DebitarEstoque(consumoNecessario);

                // Lançamento obrigatório no livro-razão (append-only)
                var movimentacao = new MovimentacaoEstoque(
                    restauranteId: restauranteId,
                    insumoId: insumo.Id,
                    tipo: TipoMovimentacao.Saida,
                    quantidade: consumoNecessario,
                    origem: OrigemMovimentacao.Venda,
                    referenciaId: venda.Id,
                    observacao: $"Baixa atómica automática via Venda {venda.Id}"
                );

                _context.MovimentacoesEstoque.Add(movimentacao);
            }

            _context.Vendas.Add(venda);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            // 5. Publicação assíncrona desacoplada de evento via IEventBus
            await _eventBus.PublishAsync(new VendaRealizadaEvent(
                venda.Id,
                restauranteId,
                venda.ValorTotal,
                venda.DataHora,
                venda.Itens.Select(i => new ItemVendaPayload(i.ProdutoId, i.Quantidade, i.PrecoUnitario)).ToList()
            ), cancellationToken);

            return venda.Id;
        });
    }
}

#endregion
