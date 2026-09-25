-- ==============================================================================
-- Manual Canónico de Engenharia de Dados: PostgreSQL 16
-- Esquema Formal DDL - Plataforma Restaurante Inteligente
-- ==============================================================================

-- Extensão para buscas de similaridade textual (autocomplete de produtos/insumos)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ------------------------------------------------------------------------------
-- 1. Restaurantes (Inquilino Central)
-- ------------------------------------------------------------------------------
CREATE TABLE "Restaurantes" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Nome" VARCHAR(150) NOT NULL,
    "Cnpj" VARCHAR(18) NOT NULL,
    "Cidade" VARCHAR(100) NOT NULL,
    "Estado" VARCHAR(2) NOT NULL,
    "Latitude" NUMERIC(10, 8) NOT NULL,
    "Longitude" NUMERIC(11, 8) NOT NULL,
    "Ativo" BOOLEAN NOT NULL DEFAULT TRUE,
    "CriadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UQ_Restaurantes_Cnpj" UNIQUE ("Cnpj")
);

-- ------------------------------------------------------------------------------
-- 2. Usuários da Plataforma
-- ------------------------------------------------------------------------------
CREATE TABLE "Usuarios" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RestauranteId" UUID NOT NULL,
    "Nome" VARCHAR(120) NOT NULL,
    "Email" VARCHAR(256) NOT NULL,
    "SenhaHash" VARCHAR(255) NOT NULL,
    "Perfil" VARCHAR(50) NOT NULL,
    "Ativo" BOOLEAN NOT NULL DEFAULT TRUE,
    "CriadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_Usuarios_Restaurante" FOREIGN KEY ("RestauranteId") 
        REFERENCES "Restaurantes"("Id") ON DELETE CASCADE,
    CONSTRAINT "UQ_Usuarios_Email" UNIQUE ("Email")
);

CREATE INDEX "IX_Usuarios_RestauranteId" ON "Usuarios"("RestauranteId");

-- ------------------------------------------------------------------------------
-- 3. Catálogo de Produtos
-- ------------------------------------------------------------------------------
CREATE TABLE "Produtos" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RestauranteId" UUID NOT NULL,
    "Nome" VARCHAR(150) NOT NULL,
    "Descricao" TEXT NULL,
    "Preco" NUMERIC(18, 2) NOT NULL,
    "Ativo" BOOLEAN NOT NULL DEFAULT TRUE,
    "CriadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xmin" XID NOT NULL,
    CONSTRAINT "FK_Produtos_Restaurante" FOREIGN KEY ("RestauranteId") 
        REFERENCES "Restaurantes"("Id") ON DELETE CASCADE,
    CONSTRAINT "CK_Produtos_Preco_Positivo" CHECK ("Preco" >= 0)
);

CREATE INDEX "IX_Produtos_RestauranteId_Nome" ON "Produtos"("RestauranteId", "Nome");

-- ------------------------------------------------------------------------------
-- 4. Insumos e Matérias-Primas
-- ------------------------------------------------------------------------------
CREATE TABLE "Insumos" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RestauranteId" UUID NOT NULL,
    "Nome" VARCHAR(150) NOT NULL,
    "UnidadeMedida" VARCHAR(10) NOT NULL,
    "QuantidadeEstoque" NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    "EstoqueMinimo" NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    "CustoUnitario" NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    "Ativo" BOOLEAN NOT NULL DEFAULT TRUE,
    "CriadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xmin" XID NOT NULL,
    CONSTRAINT "FK_Insumos_Restaurante" FOREIGN KEY ("RestauranteId") 
        REFERENCES "Restaurantes"("Id") ON DELETE CASCADE,
    CONSTRAINT "UQ_Insumos_Restaurante_Nome" UNIQUE ("RestauranteId", "Nome"),
    CONSTRAINT "CK_Insumos_Quantidade_Positiva" CHECK ("QuantidadeEstoque" >= 0),
    CONSTRAINT "CK_Insumos_Custo_Positivo" CHECK ("CustoUnitario" >= 0)
);

CREATE INDEX "IX_Insumos_Restaurante_Estoque" 
ON "Insumos"("RestauranteId", "QuantidadeEstoque", "EstoqueMinimo");

-- ------------------------------------------------------------------------------
-- 5. Fichas Técnicas (Bill of Materials - BOM)
-- ------------------------------------------------------------------------------
CREATE TABLE "ProdutosInsumos" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ProdutoId" UUID NOT NULL,
    "InsumoId" UUID NOT NULL,
    "Quantidade" NUMERIC(18, 4) NOT NULL,
    CONSTRAINT "FK_ProdutosInsumos_Produto" FOREIGN KEY ("ProdutoId") 
        REFERENCES "Produtos"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_ProdutosInsumos_Insumo" FOREIGN KEY ("InsumoId") 
        REFERENCES "Insumos"("Id") ON DELETE RESTRICT,
    CONSTRAINT "UQ_ProdutosInsumos_Composicao" UNIQUE ("ProdutoId", "InsumoId"),
    CONSTRAINT "CK_ProdutosInsumos_Quantidade_Positiva" CHECK ("Quantidade" > 0)
);

CREATE INDEX "IX_ProdutosInsumos_InsumoId" ON "ProdutosInsumos"("InsumoId");

-- ------------------------------------------------------------------------------
-- 6. Sessões de Caixa
-- ------------------------------------------------------------------------------
CREATE TABLE "FechamentosCaixa" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RestauranteId" UUID NOT NULL,
    "DataAbertura" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "DataFechamento" TIMESTAMPTZ NULL,
    "ValorTotalVendas" NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    "QuantidadeVendas" INTEGER NOT NULL DEFAULT 0,
    "Status" VARCHAR(20) NOT NULL DEFAULT 'ABERTO',
    CONSTRAINT "FK_FechamentosCaixa_Restaurante" FOREIGN KEY ("RestauranteId") 
        REFERENCES "Restaurantes"("Id") ON DELETE CASCADE,
    CONSTRAINT "CK_FechamentosCaixa_Status" CHECK ("Status" IN ('ABERTO', 'FECHADO'))
);

CREATE UNIQUE INDEX "IX_FechamentosCaixa_Ativo" 
ON "FechamentosCaixa"("RestauranteId") 
WHERE "Status" = 'ABERTO';

-- ------------------------------------------------------------------------------
-- 7. Vendas Transacionadas
-- ------------------------------------------------------------------------------
CREATE TABLE "Vendas" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RestauranteId" UUID NOT NULL,
    "FechamentoCaixaId" UUID NOT NULL,
    "DataHora" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ValorTotal" NUMERIC(18, 2) NOT NULL,
    "FormaPagamento" VARCHAR(50) NOT NULL,
    CONSTRAINT "FK_Vendas_Restaurante" FOREIGN KEY ("RestauranteId") 
        REFERENCES "Restaurantes"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Vendas_FechamentoCaixa" FOREIGN KEY ("FechamentoCaixaId") 
        REFERENCES "FechamentosCaixa"("Id") ON DELETE RESTRICT,
    CONSTRAINT "CK_Vendas_ValorTotal_Positivo" CHECK ("ValorTotal" >= 0)
);

CREATE INDEX "IX_Vendas_Restaurante_DataHora" 
ON "Vendas"("RestauranteId", "DataHora" DESC);

-- ------------------------------------------------------------------------------
-- 8. Detalhamento de Itens da Venda
-- ------------------------------------------------------------------------------
CREATE TABLE "ItensVenda" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "VendaId" UUID NOT NULL,
    "ProdutoId" UUID NOT NULL,
    "Quantidade" INTEGER NOT NULL,
    "PrecoUnitario" NUMERIC(18, 2) NOT NULL,
    "Subtotal" NUMERIC(18, 2) NOT NULL,
    CONSTRAINT "FK_ItensVenda_Venda" FOREIGN KEY ("VendaId") 
        REFERENCES "Vendas"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_ItensVenda_Produto" FOREIGN KEY ("ProdutoId") 
        REFERENCES "Produtos"("Id") ON DELETE RESTRICT,
    CONSTRAINT "CK_ItensVenda_Quantidade_Positiva" CHECK ("Quantidade" > 0),
    CONSTRAINT "CK_ItensVenda_Subtotal_Positivo" CHECK ("Subtotal" >= 0)
);

CREATE INDEX "IX_ItensVenda_VendaId" ON "ItensVenda"("VendaId");
CREATE INDEX "IX_ItensVenda_ProdutoId" ON "ItensVenda"("ProdutoId");

-- ------------------------------------------------------------------------------
-- 9. Livro-Razão de Movimentação de Estoque (Append-Only)
-- ------------------------------------------------------------------------------
CREATE TABLE "MovimentacoesEstoque" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RestauranteId" UUID NOT NULL,
    "InsumoId" UUID NOT NULL,
    "Tipo" VARCHAR(20) NOT NULL,
    "Quantidade" NUMERIC(18, 4) NOT NULL,
    "DataHora" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Origem" VARCHAR(50) NOT NULL,
    "ReferenciaId" UUID NULL,
    "Observacao" TEXT NULL,
    CONSTRAINT "FK_MovimentacoesEstoque_Restaurante" FOREIGN KEY ("RestauranteId") 
        REFERENCES "Restaurantes"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_MovimentacoesEstoque_Insumo" FOREIGN KEY ("InsumoId") 
        REFERENCES "Insumos"("Id") ON DELETE RESTRICT,
    CONSTRAINT "CK_Movimentacao_Tipo" CHECK ("Tipo" IN ('ENTRADA', 'SAIDA', 'AJUSTE')),
    CONSTRAINT "CK_Movimentacao_Quantidade_Positiva" CHECK ("Quantidade" > 0)
);

CREATE INDEX "IX_Movimentacoes_Restaurante_Insumo_Data" 
ON "MovimentacoesEstoque"("RestauranteId", "InsumoId", "DataHora" DESC);

-- ------------------------------------------------------------------------------
-- 10. Histórico de Condições Climáticas (Features para Machine Learning)
-- ------------------------------------------------------------------------------
CREATE TABLE "DadosClimaticos" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RestauranteId" UUID NOT NULL,
    "Data" DATE NOT NULL,
    "Temperatura" NUMERIC(5, 2) NOT NULL,
    "Precipitacao" NUMERIC(6, 2) NOT NULL,
    "Umidade" NUMERIC(5, 2) NOT NULL,
    "CondicaoClimatica" VARCHAR(50) NOT NULL,
    "Fonte" VARCHAR(100) NOT NULL,
    CONSTRAINT "FK_DadosClimaticos_Restaurante" FOREIGN KEY ("RestauranteId") 
        REFERENCES "Restaurantes"("Id") ON DELETE CASCADE,
    CONSTRAINT "UQ_DadosClimaticos_Restaurante_Data" UNIQUE ("RestauranteId", "Data")
);

-- ------------------------------------------------------------------------------
-- 11. Previsões de Demanda Geradas por Machine Learning
-- ------------------------------------------------------------------------------
CREATE TABLE "Previsoes" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RestauranteId" UUID NOT NULL,
    "ProdutoId" UUID NOT NULL,
    "DataPrevisao" DATE NOT NULL,
    "DemandaPrevista" NUMERIC(10, 2) NOT NULL,
    "EstoqueDisponivel" NUMERIC(10, 2) NOT NULL,
    "DemandaAtendivel" NUMERIC(10, 2) NOT NULL,
    "PossivelPerda" NUMERIC(10, 2) NOT NULL,
    "ModeloVersao" VARCHAR(50) NOT NULL,
    "CriadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_Previsoes_Restaurante" FOREIGN KEY ("RestauranteId") 
        REFERENCES "Restaurantes"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Previsoes_Produto" FOREIGN KEY ("ProdutoId") 
        REFERENCES "Produtos"("Id") ON DELETE RESTRICT,
    CONSTRAINT "UQ_Previsoes_Restaurante_Data_Produto" 
        UNIQUE ("RestauranteId", "DataPrevisao", "ProdutoId")
);

CREATE INDEX "IX_Previsoes_Restaurante_Data" 
ON "Previsoes"("RestauranteId", "DataPrevisao");

-- ------------------------------------------------------------------------------
-- 12. Políticas de Row-Level Security (RLS) - Defesa em Profundidade
-- ------------------------------------------------------------------------------
ALTER TABLE "Usuarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Usuarios" FORCE ROW LEVEL SECURITY;
CREATE POLICY restaurante_usuarios_isolation ON "Usuarios"
    FOR ALL
    USING ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid)
    WITH CHECK ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid);

ALTER TABLE "Produtos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Produtos" FORCE ROW LEVEL SECURITY;
CREATE POLICY restaurante_produtos_isolation ON "Produtos"
    FOR ALL
    USING ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid)
    WITH CHECK ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid);

ALTER TABLE "Insumos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Insumos" FORCE ROW LEVEL SECURITY;
CREATE POLICY restaurante_insumos_isolation ON "Insumos"
    FOR ALL
    USING ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid)
    WITH CHECK ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid);

ALTER TABLE "FechamentosCaixa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FechamentosCaixa" FORCE ROW LEVEL SECURITY;
CREATE POLICY restaurante_fechamentos_caixa_isolation ON "FechamentosCaixa"
    FOR ALL
    USING ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid)
    WITH CHECK ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid);

ALTER TABLE "Vendas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Vendas" FORCE ROW LEVEL SECURITY;
CREATE POLICY restaurante_vendas_isolation ON "Vendas"
    FOR ALL
    USING ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid)
    WITH CHECK ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid);

ALTER TABLE "MovimentacoesEstoque" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MovimentacoesEstoque" FORCE ROW LEVEL SECURITY;
CREATE POLICY restaurante_movimentacoes_isolation ON "MovimentacoesEstoque"
    FOR ALL
    USING ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid)
    WITH CHECK ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid);

ALTER TABLE "DadosClimaticos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DadosClimaticos" FORCE ROW LEVEL SECURITY;
CREATE POLICY restaurante_dados_climaticos_isolation ON "DadosClimaticos"
    FOR ALL
    USING ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid)
    WITH CHECK ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid);

ALTER TABLE "Previsoes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Previsoes" FORCE ROW LEVEL SECURITY;
CREATE POLICY restaurante_previsoes_isolation ON "Previsoes"
    FOR ALL
    USING ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid)
    WITH CHECK ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid);
