-- ==============================================================================
-- Migração incremental: Adiciona PinHash em Usuarios e cria tabelas de
-- MovimentacoesCaixa, OrdensCompra e ItensOrdemCompra com RLS.
-- ==============================================================================

-- 1. Coluna PinHash em Usuarios
ALTER TABLE "Usuarios" ADD COLUMN IF NOT EXISTS "PinHash" VARCHAR(255);

-- 2. Tabela MovimentacoesCaixa
CREATE TABLE IF NOT EXISTS "MovimentacoesCaixa" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RestauranteId" UUID NOT NULL,
    "FechamentoCaixaId" UUID NOT NULL,
    "UsuarioId" UUID NOT NULL,
    "Tipo" VARCHAR(20) NOT NULL,
    "Valor" NUMERIC(18,2) NOT NULL,
    "Motivo" VARCHAR(255) NOT NULL,
    "DataHora" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_MovimentacoesCaixa_Restaurantes" FOREIGN KEY ("RestauranteId")
        REFERENCES "Restaurantes"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_MovimentacoesCaixa_FechamentosCaixa" FOREIGN KEY ("FechamentoCaixaId")
        REFERENCES "FechamentosCaixa"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_MovimentacoesCaixa_Usuarios" FOREIGN KEY ("UsuarioId")
        REFERENCES "Usuarios"("Id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "IX_MovimentacoesCaixa_RestauranteId" ON "MovimentacoesCaixa"("RestauranteId");
CREATE INDEX IF NOT EXISTS "IX_MovimentacoesCaixa_FechamentoCaixaId" ON "MovimentacoesCaixa"("FechamentoCaixaId");

-- 3. Tabela OrdensCompra
CREATE TABLE IF NOT EXISTS "OrdensCompra" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RestauranteId" UUID NOT NULL,
    "Protocolo" VARCHAR(50) NOT NULL,
    "Status" VARCHAR(20) NOT NULL,
    "ValorTotalEstimado" NUMERIC(18,2) NOT NULL,
    "UsuarioId" UUID NOT NULL,
    "CriadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_OrdensCompra_Restaurantes" FOREIGN KEY ("RestauranteId")
        REFERENCES "Restaurantes"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_OrdensCompra_Usuarios" FOREIGN KEY ("UsuarioId")
        REFERENCES "Usuarios"("Id") ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_OrdensCompra_RestauranteId_Protocolo" ON "OrdensCompra"("RestauranteId", "Protocolo");
CREATE INDEX IF NOT EXISTS "IX_OrdensCompra_CriadoEm" ON "OrdensCompra"("CriadoEm");

-- 4. Tabela ItensOrdemCompra
CREATE TABLE IF NOT EXISTS "ItensOrdemCompra" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RestauranteId" UUID NOT NULL,
    "OrdemCompraId" UUID NOT NULL,
    "InsumoId" UUID NOT NULL,
    "Quantidade" NUMERIC(18,4) NOT NULL,
    "PrecoUnitarioEstimado" NUMERIC(18,2) NOT NULL,
    "SubtotalEstimado" NUMERIC(18,2) NOT NULL,
    CONSTRAINT "FK_ItensOrdemCompra_Restaurantes" FOREIGN KEY ("RestauranteId")
        REFERENCES "Restaurantes"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_ItensOrdemCompra_OrdensCompra" FOREIGN KEY ("OrdemCompraId")
        REFERENCES "OrdensCompra"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_ItensOrdemCompra_Insumos" FOREIGN KEY ("InsumoId")
        REFERENCES "Insumos"("Id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "IX_ItensOrdemCompra_OrdemCompraId" ON "ItensOrdemCompra"("OrdemCompraId");
CREATE INDEX IF NOT EXISTS "IX_ItensOrdemCompra_InsumoId" ON "ItensOrdemCompra"("InsumoId");
CREATE INDEX IF NOT EXISTS "IX_ItensOrdemCompra_RestauranteId" ON "ItensOrdemCompra"("RestauranteId");

-- 5. Configuração de Row-Level Security (RLS)
ALTER TABLE "MovimentacoesCaixa" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MovimentacoesCaixa" FORCE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'MovimentacoesCaixa' AND policyname = 'restaurante_movimentacoes_caixa_isolation'
    ) THEN
        CREATE POLICY restaurante_movimentacoes_caixa_isolation ON "MovimentacoesCaixa"
            FOR ALL
            USING ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid)
            WITH CHECK ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid);
    END IF;
END $$;

ALTER TABLE "OrdensCompra" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrdensCompra" FORCE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'OrdensCompra' AND policyname = 'restaurante_ordens_compra_isolation'
    ) THEN
        CREATE POLICY restaurante_ordens_compra_isolation ON "OrdensCompra"
            FOR ALL
            USING ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid)
            WITH CHECK ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid);
    END IF;
END $$;

ALTER TABLE "ItensOrdemCompra" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ItensOrdemCompra" FORCE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'ItensOrdemCompra' AND policyname = 'restaurante_itens_ordem_compra_isolation'
    ) THEN
        CREATE POLICY restaurante_itens_ordem_compra_isolation ON "ItensOrdemCompra"
            FOR ALL
            USING ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid)
            WITH CHECK ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid);
    END IF;
END $$;
