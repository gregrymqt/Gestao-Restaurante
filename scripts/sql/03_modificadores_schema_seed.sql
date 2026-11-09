-- ==============================================================================
-- Schema e Seeds de Modificadores de Pedido (Modifiers & Tags)
-- Multi-Tenant com PostgreSQL 16 e FORCE ROW LEVEL SECURITY (RLS)
-- ==============================================================================

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
GRANT SELECT, INSERT, UPDATE, DELETE ON "GruposModificadores" TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON "OpcoesModificadores" TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON "ProdutosGruposModificadores" TO app_user;

-- 6. Seeds Ilustrativos para o Restaurante Padrão
SET app.current_restaurante_id = '11111111-1111-1111-1111-111111111111';

-- Grupo 1: Ponto da Carne (Obrigatório, Escolha Única)
INSERT INTO "GruposModificadores" (
    "Id", "RestauranteId", "Nome", "Descricao", "Obrigatorio", "MinimoSelecoes", "MaximoSelecoes", "Ativo"
) VALUES (
    'aa111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Ponto da Carne',
    'Escolha exatamente o ponto desejado',
    TRUE,
    1,
    1,
    TRUE
) ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "OpcoesModificadores" (
    "Id", "RestauranteId", "GrupoModificadorId", "Nome", "PrecoAdicional", "InsumoId", "QuantidadeInsumo", "TipoAcao", "Ativo"
) VALUES 
(
    'bb111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'aa111111-1111-1111-1111-111111111111'::uuid,
    'Ao Ponto (Rosado e Suculento)',
    0.00,
    NULL,
    0.0000,
    1, -- Culinario
    TRUE
),
(
    'bb111111-1111-1111-1111-111111111112'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'aa111111-1111-1111-1111-111111111111'::uuid,
    'Bem Passado (Sem Sangue)',
    0.00,
    NULL,
    0.0000,
    1, -- Culinario
    TRUE
),
(
    'bb111111-1111-1111-1111-111111111113'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'aa111111-1111-1111-1111-111111111111'::uuid,
    'Mal Passado (Selado por Fora)',
    0.00,
    NULL,
    0.0000,
    1, -- Culinario
    TRUE
) ON CONFLICT ("Id") DO NOTHING;

-- Grupo 2: Observações / Remoções (Opcional, Múltipla)
INSERT INTO "GruposModificadores" (
    "Id", "RestauranteId", "Nome", "Descricao", "Obrigatorio", "MinimoSelecoes", "MaximoSelecoes", "Ativo"
) VALUES (
    'aa222222-2222-2222-2222-222222222222'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Observações de Cozinha',
    'Retire ingredientes que não deseja',
    FALSE,
    0,
    3,
    TRUE
) ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "OpcoesModificadores" (
    "Id", "RestauranteId", "GrupoModificadorId", "Nome", "PrecoAdicional", "InsumoId", "QuantidadeInsumo", "TipoAcao", "Ativo"
) VALUES 
(
    'bb222222-2222-2222-2222-222222222221'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'aa222222-2222-2222-2222-222222222222'::uuid,
    'Sem Cebola',
    0.00,
    NULL,
    0.0000,
    3, -- Remocao
    TRUE
),
(
    'bb222222-2222-2222-2222-222222222222'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'aa222222-2222-2222-2222-222222222222'::uuid,
    'Sem Picles',
    0.00,
    NULL,
    0.0000,
    3, -- Remocao
    TRUE
),
(
    'bb222222-2222-2222-2222-222222222223'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'aa222222-2222-2222-2222-222222222222'::uuid,
    'Sem Maionese',
    0.00,
    NULL,
    0.0000,
    3, -- Remocao
    TRUE
) ON CONFLICT ("Id") DO NOTHING;

-- Grupo 3: Adicionais Especiais (Opcional, Múltipla)
INSERT INTO "GruposModificadores" (
    "Id", "RestauranteId", "Nome", "Descricao", "Obrigatorio", "MinimoSelecoes", "MaximoSelecoes", "Ativo"
) VALUES (
    'aa333333-3333-3333-3333-333333333333'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Adicionais Especiais',
    'Turbine seu pedido',
    FALSE,
    0,
    3,
    TRUE
) ON CONFLICT ("Id") DO NOTHING;

-- Adicional Bacon vinculado ao Insumo Bacon (33333333-3333-3333-3333-333333333333) e Cheddar (44444444-4444-4444-4444-444444444444)
INSERT INTO "OpcoesModificadores" (
    "Id", "RestauranteId", "GrupoModificadorId", "Nome", "PrecoAdicional", "InsumoId", "QuantidadeInsumo", "TipoAcao", "Ativo"
) VALUES 
(
    'bb333333-3333-3333-3333-333333333331'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'aa333333-3333-3333-3333-333333333333'::uuid,
    '+ Bacon Fatiado Defumado',
    4.50,
    '33333333-3333-3333-3333-333333333333'::uuid,
    0.0400, -- 40g de Bacon
    2, -- Adicional
    TRUE
),
(
    'bb333333-3333-3333-3333-333333333332'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'aa333333-3333-3333-3333-333333333333'::uuid,
    '+ Queijo Cheddar Extra',
    3.50,
    '44444444-4444-4444-4444-444444444444'::uuid,
    0.0300, -- 30g de Queijo
    2, -- Adicional
    TRUE
) ON CONFLICT ("Id") DO NOTHING;

-- Vincular os 3 grupos aos Hambúrgueres do Catálogo
-- 1. Cheeseburger Clássico (3abeb11d-fdeb-4755-b797-6e5ad1a48e52)
INSERT INTO "ProdutosGruposModificadores" ("Id", "RestauranteId", "ProdutoId", "GrupoModificadorId", "OrdemExibicao")
VALUES 
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '3abeb11d-fdeb-4755-b797-6e5ad1a48e52'::uuid, 'aa111111-1111-1111-1111-111111111111'::uuid, 1),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '3abeb11d-fdeb-4755-b797-6e5ad1a48e52'::uuid, 'aa222222-2222-2222-2222-222222222222'::uuid, 2),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '3abeb11d-fdeb-4755-b797-6e5ad1a48e52'::uuid, 'aa333333-3333-3333-3333-333333333333'::uuid, 3)
ON CONFLICT ("ProdutoId", "GrupoModificadorId") DO NOTHING;

-- 2. Double Smash Bacon (55555555-5555-5555-5555-555555555552)
INSERT INTO "ProdutosGruposModificadores" ("Id", "RestauranteId", "ProdutoId", "GrupoModificadorId", "OrdemExibicao")
VALUES 
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555552'::uuid, 'aa111111-1111-1111-1111-111111111111'::uuid, 1),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555552'::uuid, 'aa222222-2222-2222-2222-222222222222'::uuid, 2),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555552'::uuid, 'aa333333-3333-3333-3333-333333333333'::uuid, 3)
ON CONFLICT ("ProdutoId", "GrupoModificadorId") DO NOTHING;

-- 3. Hambúrguer Artesanal Supremo (55555555-5555-5555-5555-555555555555)
INSERT INTO "ProdutosGruposModificadores" ("Id", "RestauranteId", "ProdutoId", "GrupoModificadorId", "OrdemExibicao")
VALUES 
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555555'::uuid, 'aa111111-1111-1111-1111-111111111111'::uuid, 1),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555555'::uuid, 'aa222222-2222-2222-2222-222222222222'::uuid, 2),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555555'::uuid, 'aa333333-3333-3333-3333-333333333333'::uuid, 3)
ON CONFLICT ("ProdutoId", "GrupoModificadorId") DO NOTHING;
