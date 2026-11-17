-- Atualização 03: schema de modificadores para bancos existentes.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL search_path TO public;

-- 1. Coluna de Snapshot JSONB em ItensVenda
ALTER TABLE "ItensVenda"
ADD COLUMN IF NOT EXISTS "ModificadoresJson" JSONB NULL;

-- 2. Tabela de Grupos de Modificadores
CREATE TABLE IF NOT EXISTS "GruposModificadores" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RestauranteId" UUID NOT NULL,
    "Nome" VARCHAR(100) NOT NULL,
    "Descricao" VARCHAR(255) NULL,
    "Obrigatorio" BOOLEAN NOT NULL DEFAULT FALSE,
    "MinimoSelecoes" INT NOT NULL DEFAULT 0,
    "MaximoSelecoes" INT NOT NULL DEFAULT 1,
    "Ativo" BOOLEAN NOT NULL DEFAULT TRUE,
    "CriadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_GruposModificadores_Restaurante" FOREIGN KEY ("RestauranteId")
        REFERENCES "Restaurantes"("Id") ON DELETE CASCADE,
    CONSTRAINT "CK_GruposModificadores_Selecoes" CHECK ("MinimoSelecoes" >= 0 AND "MaximoSelecoes" >= "MinimoSelecoes")
);

CREATE INDEX IF NOT EXISTS "IX_GruposModificadores_RestauranteId" ON "GruposModificadores"("RestauranteId");

-- 3. Tabela de Opções de Modificadores
CREATE TABLE IF NOT EXISTS "OpcoesModificadores" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RestauranteId" UUID NOT NULL,
    "GrupoModificadorId" UUID NOT NULL,
    "Nome" VARCHAR(100) NOT NULL,
    "PrecoAdicional" NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    "InsumoId" UUID NULL,
    "QuantidadeInsumo" NUMERIC(18, 4) NOT NULL DEFAULT 0.0000,
    "TipoAcao" INT NOT NULL DEFAULT 1, -- 1=Culinario, 2=Adicional, 3=Remocao
    "Ativo" BOOLEAN NOT NULL DEFAULT TRUE,
    "CriadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FK_OpcoesModificadores_Restaurante" FOREIGN KEY ("RestauranteId")
        REFERENCES "Restaurantes"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_OpcoesModificadores_Grupo" FOREIGN KEY ("GrupoModificadorId")
        REFERENCES "GruposModificadores"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_OpcoesModificadores_Insumo" FOREIGN KEY ("InsumoId")
        REFERENCES "Insumos"("Id") ON DELETE RESTRICT,
    CONSTRAINT "CK_OpcoesModificadores_Preco" CHECK ("PrecoAdicional" >= 0),
    CONSTRAINT "CK_OpcoesModificadores_QtdInsumo" CHECK ("QuantidadeInsumo" >= 0)
);

CREATE INDEX IF NOT EXISTS "IX_OpcoesModificadores_RestauranteId" ON "OpcoesModificadores"("RestauranteId");
CREATE INDEX IF NOT EXISTS "IX_OpcoesModificadores_GrupoModificadorId" ON "OpcoesModificadores"("GrupoModificadorId");
CREATE INDEX IF NOT EXISTS "IX_OpcoesModificadores_InsumoId" ON "OpcoesModificadores"("InsumoId");

-- 4. Associação N:N entre Produto e Grupos de Modificadores
CREATE TABLE IF NOT EXISTS "ProdutosGruposModificadores" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RestauranteId" UUID NOT NULL,
    "ProdutoId" UUID NOT NULL,
    "GrupoModificadorId" UUID NOT NULL,
    "OrdemExibicao" INT NOT NULL DEFAULT 0,
    CONSTRAINT "FK_ProdutosGruposModificadores_Restaurante" FOREIGN KEY ("RestauranteId")
        REFERENCES "Restaurantes"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_ProdutosGruposModificadores_Produto" FOREIGN KEY ("ProdutoId")
        REFERENCES "Produtos"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_ProdutosGruposModificadores_Grupo" FOREIGN KEY ("GrupoModificadorId")
        REFERENCES "GruposModificadores"("Id") ON DELETE CASCADE,
    CONSTRAINT "UQ_ProdutosGruposModificadores" UNIQUE ("ProdutoId", "GrupoModificadorId")
);

CREATE INDEX IF NOT EXISTS "IX_ProdutosGruposModificadores_RestauranteId" ON "ProdutosGruposModificadores"("RestauranteId");

-- 5. Ativação de RLS e Políticas de Segurança
ALTER TABLE "GruposModificadores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GruposModificadores" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS restaurante_grupos_modificadores_isolation ON "GruposModificadores";
CREATE POLICY restaurante_grupos_modificadores_isolation ON "GruposModificadores"
    FOR ALL
    USING ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid)
    WITH CHECK ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid);

ALTER TABLE "OpcoesModificadores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OpcoesModificadores" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS restaurante_opcoes_modificadores_isolation ON "OpcoesModificadores";
CREATE POLICY restaurante_opcoes_modificadores_isolation ON "OpcoesModificadores"
    FOR ALL
    USING ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid)
    WITH CHECK ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid);

ALTER TABLE "ProdutosGruposModificadores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProdutosGruposModificadores" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS restaurante_produtos_grupos_modificadores_isolation ON "ProdutosGruposModificadores";
CREATE POLICY restaurante_produtos_grupos_modificadores_isolation ON "ProdutosGruposModificadores"
    FOR ALL
    USING ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid)
    WITH CHECK ("RestauranteId" = NULLIF(current_setting('app.current_restaurante_id', true), '')::uuid);

-- Concessão de permissões para app_user
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON
            "GruposModificadores", "OpcoesModificadores", "ProdutosGruposModificadores" TO app_user;
    END IF;
END
$$;

-- Normaliza os nomes e tipos do schema inicial anterior.
ALTER TABLE "GruposModificadores"
    ADD COLUMN IF NOT EXISTS "CriadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "OpcoesModificadores"
    ADD COLUMN IF NOT EXISTS "CriadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ProdutosGruposModificadores' AND column_name = 'Ordem'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ProdutosGruposModificadores' AND column_name = 'OrdemExibicao'
    ) THEN
        ALTER TABLE "ProdutosGruposModificadores" RENAME COLUMN "Ordem" TO "OrdemExibicao";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'OpcoesModificadores'
          AND column_name = 'TipoAcao' AND data_type IN ('text', 'character varying')
    ) THEN
        ALTER TABLE "OpcoesModificadores" ALTER COLUMN "TipoAcao" DROP DEFAULT;
        ALTER TABLE "OpcoesModificadores" ALTER COLUMN "TipoAcao" TYPE INTEGER
        USING (CASE "TipoAcao"
            WHEN 'Culinario' THEN 1
            WHEN 'Adicional' THEN 2
            WHEN 'Remocao' THEN 3
            ELSE "TipoAcao"::integer
        END);
        ALTER TABLE "OpcoesModificadores" ALTER COLUMN "TipoAcao" SET DEFAULT 1;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ItensVenda'
          AND column_name = 'ModificadoresJson' AND data_type IN ('text', 'character varying')
    ) THEN
        ALTER TABLE "ItensVenda" ALTER COLUMN "ModificadoresJson" TYPE JSONB
        USING "ModificadoresJson"::jsonb;
    END IF;
END
$$;

COMMIT;
