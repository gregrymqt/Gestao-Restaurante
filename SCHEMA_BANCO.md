# Dicionario de Dados e Schemas - PostgreSQL 16
Sistema Restaurante Inteligente | Multi-Tenant com RLS | Data: 2026-10-01 11:25:11

| Tabela | Coluna | Tipo de Dado | Restricao / Constraint |
| :--- | :--- | :--- | :--- |
| Assinaturas | Id | uuid | PRIMARY KEY |
| Assinaturas | RestauranteId | uuid | UNIQUE |
| Assinaturas | RestauranteId | uuid | FOREIGN KEY |
| Assinaturas | PlanoId | uuid | FOREIGN KEY |
| Assinaturas | Status | character varying | COLUNA |
| Assinaturas | DataInicio | timestamp with time zone | COLUNA |
| Assinaturas | DataFimTrial | timestamp with time zone | COLUNA |
| Assinaturas | DataExpiracao | timestamp with time zone | COLUNA |
| Assinaturas | CriadoEm | timestamp with time zone | COLUNA |
| DadosClimaticos | Id | uuid | PRIMARY KEY |
| DadosClimaticos | RestauranteId | uuid | FOREIGN KEY |
| DadosClimaticos | RestauranteId | uuid | UNIQUE |
| DadosClimaticos | Data | date | UNIQUE |
| DadosClimaticos | Temperatura | numeric | COLUNA |
| DadosClimaticos | Precipitacao | numeric | COLUNA |
| DadosClimaticos | Umidade | numeric | COLUNA |
| DadosClimaticos | CondicaoClimatica | character varying | COLUNA |
| DadosClimaticos | Fonte | character varying | COLUNA |
| DadosClimaticos | TipoDado | character varying | COLUNA |
| DadosClimaticos | ConsultadoEm | timestamp with time zone | COLUNA |
| FechamentosCaixa | Id | uuid | PRIMARY KEY |
| FechamentosCaixa | RestauranteId | uuid | FOREIGN KEY |
| FechamentosCaixa | UsuarioId | uuid | FOREIGN KEY |
| FechamentosCaixa | DataAbertura | timestamp with time zone | COLUNA |
| FechamentosCaixa | DataFechamento | timestamp with time zone | COLUNA |
| FechamentosCaixa | ValorTotalVendas | numeric | COLUNA |
| FechamentosCaixa | QuantidadeVendas | integer | COLUNA |
| FechamentosCaixa | Status | character varying | COLUNA |
| FechamentosCaixa | CriadoEm | timestamp with time zone | COLUNA |
| Insumos | Id | uuid | PRIMARY KEY |
| Insumos | RestauranteId | uuid | FOREIGN KEY |
| Insumos | RestauranteId | uuid | UNIQUE |
| Insumos | Nome | character varying | UNIQUE |
| Insumos | UnidadeMedida | character varying | COLUNA |
| Insumos | QuantidadeEstoque | numeric | COLUNA |
| Insumos | EstoqueMinimo | numeric | COLUNA |
| Insumos | CustoUnitario | numeric | COLUNA |
| Insumos | Ativo | boolean | COLUNA |
| Insumos | CriadoEm | timestamp with time zone | COLUNA |
| ItensVenda | Id | uuid | PRIMARY KEY |
| ItensVenda | RestauranteId | uuid | FOREIGN KEY |
| ItensVenda | VendaId | uuid | FOREIGN KEY |
| ItensVenda | ProdutoId | uuid | FOREIGN KEY |
| ItensVenda | Quantidade | numeric | COLUNA |
| ItensVenda | PrecoUnitario | numeric | COLUNA |
| ItensVenda | Subtotal | numeric | COLUNA |
| MovimentacoesEstoque | Id | uuid | PRIMARY KEY |
| MovimentacoesEstoque | RestauranteId | uuid | FOREIGN KEY |
| MovimentacoesEstoque | InsumoId | uuid | FOREIGN KEY |
| MovimentacoesEstoque | Tipo | character varying | COLUNA |
| MovimentacoesEstoque | Quantidade | numeric | COLUNA |
| MovimentacoesEstoque | DataHora | timestamp with time zone | COLUNA |
| MovimentacoesEstoque | Origem | character varying | COLUNA |
| MovimentacoesEstoque | ReferenciaId | uuid | COLUNA |
| MovimentacoesEstoque | Observacao | text | COLUNA |
| Planos | Id | uuid | PRIMARY KEY |
| Planos | Nome | character varying | UNIQUE |
| Planos | Descricao | character varying | COLUNA |
| Planos | PrecoMensal | numeric | COLUNA |
| Planos | PossuiModuloIa | boolean | COLUNA |
| Planos | Ativo | boolean | COLUNA |
| Planos | CriadoEm | timestamp with time zone | COLUNA |
| Previsoes | Id | uuid | PRIMARY KEY |
| Previsoes | RestauranteId | uuid | FOREIGN KEY |
| Previsoes | RestauranteId | uuid | UNIQUE |
| Previsoes | ProdutoId | uuid | FOREIGN KEY |
| Previsoes | ProdutoId | uuid | UNIQUE |
| Previsoes | DataPrevisao | date | UNIQUE |
| Previsoes | DataReferencia | date | COLUNA |
| Previsoes | DemandaPrevista | numeric | COLUNA |
| Previsoes | EstoqueDisponivel | numeric | COLUNA |
| Previsoes | DemandaAtendivel | numeric | COLUNA |
| Previsoes | PossivelPerda | numeric | COLUNA |
| Previsoes | ModeloVersao | character varying | COLUNA |
| Previsoes | CriadoEm | timestamp with time zone | COLUNA |
| Produtos | Id | uuid | PRIMARY KEY |
| Produtos | RestauranteId | uuid | FOREIGN KEY |
| Produtos | Nome | character varying | COLUNA |
| Produtos | Descricao | text | COLUNA |
| Produtos | Preco | numeric | COLUNA |
| Produtos | Ativo | boolean | COLUNA |
| Produtos | CriadoEm | timestamp with time zone | COLUNA |
| ProdutosInsumos | Id | uuid | PRIMARY KEY |
| ProdutosInsumos | RestauranteId | uuid | FOREIGN KEY |
| ProdutosInsumos | ProdutoId | uuid | FOREIGN KEY |
| ProdutosInsumos | ProdutoId | uuid | UNIQUE |
| ProdutosInsumos | InsumoId | uuid | FOREIGN KEY |
| ProdutosInsumos | InsumoId | uuid | UNIQUE |
| ProdutosInsumos | Quantidade | numeric | COLUNA |
| Restaurantes | Id | uuid | PRIMARY KEY |
| Restaurantes | Nome | character varying | COLUNA |
| Restaurantes | Cnpj | character varying | UNIQUE |
| Restaurantes | Cidade | character varying | COLUNA |
| Restaurantes | Estado | character varying | COLUNA |
| Restaurantes | Latitude | numeric | COLUNA |
| Restaurantes | Longitude | numeric | COLUNA |
| Restaurantes | Ativo | boolean | COLUNA |
| Restaurantes | CriadoEm | timestamp with time zone | COLUNA |
| Usuarios | Id | uuid | PRIMARY KEY |
| Usuarios | RestauranteId | uuid | FOREIGN KEY |
| Usuarios | Nome | character varying | COLUNA |
| Usuarios | Email | character varying | UNIQUE |
| Usuarios | SenhaHash | character varying | COLUNA |
| Usuarios | Perfil | character varying | COLUNA |
| Usuarios | Ativo | boolean | COLUNA |
| Usuarios | CriadoEm | timestamp with time zone | COLUNA |
| Vendas | Id | uuid | PRIMARY KEY |
| Vendas | RestauranteId | uuid | FOREIGN KEY |
| Vendas | FechamentoCaixaId | uuid | FOREIGN KEY |
| Vendas | DataHora | timestamp with time zone | COLUNA |
| Vendas | ValorTotal | numeric | COLUNA |
| Vendas | FormaPagamento | character varying | COLUNA |
| Vendas | Status | character varying | COLUNA |
| Vendas | CriadoEm | timestamp with time zone | COLUNA |
| __EFMigrationsHistory | MigrationId | character varying | PRIMARY KEY |
| __EFMigrationsHistory | ProductVersion | character varying | COLUNA |
