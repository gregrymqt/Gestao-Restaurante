-- Dados ilustrativos. Execute apenas em ambiente de demonstração com o catálogo correspondente.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL app.current_restaurante_id = '11111111-1111-1111-1111-111111111111';

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
-- Vincula apenas os produtos de demonstração presentes no catálogo do restaurante.
INSERT INTO "ProdutosGruposModificadores" ("RestauranteId", "ProdutoId", "GrupoModificadorId", "OrdemExibicao")
SELECT p."RestauranteId", p."Id", g."Id", modelo.ordem
FROM "Produtos" p
CROSS JOIN (VALUES
    ('aa111111-1111-1111-1111-111111111111'::uuid, 1),
    ('aa222222-2222-2222-2222-222222222222'::uuid, 2),
    ('aa333333-3333-3333-3333-333333333333'::uuid, 3)
) AS modelo(grupo_id, ordem)
JOIN "GruposModificadores" g ON g."Id" = modelo.grupo_id AND g."RestauranteId" = p."RestauranteId"
WHERE p."RestauranteId" = '11111111-1111-1111-1111-111111111111'::uuid
  AND p."Id" IN (
      '3abeb11d-fdeb-4755-b797-6e5ad1a48e52'::uuid,
      '55555555-5555-5555-5555-555555555552'::uuid,
      '55555555-5555-5555-5555-555555555555'::uuid
  )
ON CONFLICT ("ProdutoId", "GrupoModificadorId") DO NOTHING;

COMMIT;
