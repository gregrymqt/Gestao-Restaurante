-- ==============================================================================
-- Carga Inicial de Dados (Seed Declarativo) para Ambiente Docker / Homologação
-- Restaurante Padrão, Operador PDV, Catálogo, Insumos, BOM e Livro-Razão
-- ==============================================================================

-- 1. Estabelece escopo de tenant para satisfazer as políticas de FORCE ROW LEVEL SECURITY (RLS)
SET app.current_restaurante_id = '11111111-1111-1111-1111-111111111111';

DO $$
BEGIN
    -- 2. Inserção do Restaurante Padrão de Homologação
    IF NOT EXISTS (SELECT 1 FROM "Restaurantes" WHERE "Id" = '11111111-1111-1111-1111-111111111111'::uuid) THEN
        INSERT INTO "Restaurantes" (
            "Id", "Nome", "Cnpj", "Cidade", "Estado", "Latitude", "Longitude", "Ativo", "CriadoEm"
        ) VALUES (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'Restaurante Teste E2E',
            '12.345.678/0001-90',
            'São Paulo',
            'SP',
            -23.550520,
            -46.633308,
            TRUE,
            CURRENT_TIMESTAMP
        );
    END IF;

    -- 3. Inserção do Operador de Caixa / Administrador (Senha: 123456 via PBKDF2)
    IF NOT EXISTS (SELECT 1 FROM "Usuarios" WHERE "Email" = 'operador@restaurante.com') THEN
        INSERT INTO "Usuarios" (
            "Id", "RestauranteId", "Nome", "Email", "SenhaHash", "Perfil", "Ativo", "CriadoEm"
        ) VALUES (
            '99999999-9999-9999-9999-999999999999'::uuid,
            '11111111-1111-1111-1111-111111111111'::uuid,
            'Operador Homologação',
            'operador@restaurante.com',
            '100000.mEZvy32kdsQSwv74NSu++g==.SrVf0vv/434/flq7xTUOzl62Aep2uce/m7HUvRkc3AY=',
            'Operador',
            TRUE,
            CURRENT_TIMESTAMP
        );
    END IF;

    -- 4. Inserção dos Insumos Críticos com Saldo 10 e Mínimo 5
    -- Insumo 1: Pão Brioche
    IF NOT EXISTS (SELECT 1 FROM "Insumos" WHERE "Id" = '22222222-2222-2222-2222-222222222222'::uuid) THEN
        INSERT INTO "Insumos" (
            "Id", "RestauranteId", "Nome", "UnidadeMedida", "QuantidadeEstoque", "EstoqueMinimo", "CustoUnitario", "Ativo", "CriadoEm"
        ) VALUES (
            '22222222-2222-2222-2222-222222222222'::uuid,
            '11111111-1111-1111-1111-111111111111'::uuid,
            'Pão Brioche Artesanal',
            'UN',
            10.0000,
            5.0000,
            2.50,
            TRUE,
            CURRENT_TIMESTAMP
        );
    END IF;

    -- Insumo 2: Hambúrguer de Carne Angus
    IF NOT EXISTS (SELECT 1 FROM "Insumos" WHERE "Id" = '33333333-3333-3333-3333-333333333333'::uuid) THEN
        INSERT INTO "Insumos" (
            "Id", "RestauranteId", "Nome", "UnidadeMedida", "QuantidadeEstoque", "EstoqueMinimo", "CustoUnitario", "Ativo", "CriadoEm"
        ) VALUES (
            '33333333-3333-3333-3333-333333333333'::uuid,
            '11111111-1111-1111-1111-111111111111'::uuid,
            'Hambúrguer de Carne Angus 180g',
            'UN',
            10.0000,
            5.0000,
            8.00,
            TRUE,
            CURRENT_TIMESTAMP
        );
    END IF;

    -- Insumo 3: Queijo Cheddar
    IF NOT EXISTS (SELECT 1 FROM "Insumos" WHERE "Id" = '44444444-4444-4444-4444-444444444444'::uuid) THEN
        INSERT INTO "Insumos" (
            "Id", "RestauranteId", "Nome", "UnidadeMedida", "QuantidadeEstoque", "EstoqueMinimo", "CustoUnitario", "Ativo", "CriadoEm"
        ) VALUES (
            '44444444-4444-4444-4444-444444444444'::uuid,
            '11111111-1111-1111-1111-111111111111'::uuid,
            'Queijo Cheddar Fatiado',
            'UN',
            10.0000,
            5.0000,
            1.50,
            TRUE,
            CURRENT_TIMESTAMP
        );
    END IF;

    -- 5. Inserção do Produto: Hambúrguer Artesanal Supremo
    IF NOT EXISTS (SELECT 1 FROM "Produtos" WHERE "Id" = '55555555-5555-5555-5555-555555555555'::uuid) THEN
        INSERT INTO "Produtos" (
            "Id", "RestauranteId", "Nome", "Descricao", "Preco", "Ativo", "CriadoEm"
        ) VALUES (
            '55555555-5555-5555-5555-555555555555'::uuid,
            '11111111-1111-1111-1111-111111111111'::uuid,
            'Hambúrguer Artesanal Supremo',
            'Delicioso hambúrguer artesanal com blend angus, pão brioche e queijo cheddar derretido.',
            38.00,
            TRUE,
            CURRENT_TIMESTAMP
        );
    END IF;

    -- 6. Inserção da Ficha Técnica (BOM)
    IF NOT EXISTS (SELECT 1 FROM "ProdutosInsumos" WHERE "ProdutoId" = '55555555-5555-5555-5555-555555555555'::uuid AND "InsumoId" = '22222222-2222-2222-2222-222222222222'::uuid) THEN
        INSERT INTO "ProdutosInsumos" ("Id", "RestauranteId", "ProdutoId", "InsumoId", "Quantidade")
        VALUES (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555555'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 1.0000);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ProdutosInsumos" WHERE "ProdutoId" = '55555555-5555-5555-5555-555555555555'::uuid AND "InsumoId" = '33333333-3333-3333-3333-333333333333'::uuid) THEN
        INSERT INTO "ProdutosInsumos" ("Id", "RestauranteId", "ProdutoId", "InsumoId", "Quantidade")
        VALUES (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555555'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 1.0000);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "ProdutosInsumos" WHERE "ProdutoId" = '55555555-5555-5555-5555-555555555555'::uuid AND "InsumoId" = '44444444-4444-4444-4444-444444444444'::uuid) THEN
        INSERT INTO "ProdutosInsumos" ("Id", "RestauranteId", "ProdutoId", "InsumoId", "Quantidade")
        VALUES (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555555'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 1.0000);
    END IF;

    -- 7. Lançamentos Iniciais no Livro-Razão Imutável (MovimentacoesEstoque)
    IF NOT EXISTS (SELECT 1 FROM "MovimentacoesEstoque" WHERE "InsumoId" = '22222222-2222-2222-2222-222222222222'::uuid) THEN
        INSERT INTO "MovimentacoesEstoque" (
            "Id", "RestauranteId", "InsumoId", "Tipo", "Quantidade", "DataHora", "Origem", "Observacao"
        ) VALUES (
            gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid,
            'ENTRADA', 10.0000, CURRENT_TIMESTAMP, 'COMPRA', 'Carga inicial de estoque para homologação'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "MovimentacoesEstoque" WHERE "InsumoId" = '33333333-3333-3333-3333-333333333333'::uuid) THEN
        INSERT INTO "MovimentacoesEstoque" (
            "Id", "RestauranteId", "InsumoId", "Tipo", "Quantidade", "DataHora", "Origem", "Observacao"
        ) VALUES (
            gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '33333333-3333-3333-3333-333333333333'::uuid,
            'ENTRADA', 10.0000, CURRENT_TIMESTAMP, 'COMPRA', 'Carga inicial de estoque para homologação'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM "MovimentacoesEstoque" WHERE "InsumoId" = '44444444-4444-4444-4444-444444444444'::uuid) THEN
        INSERT INTO "MovimentacoesEstoque" (
            "Id", "RestauranteId", "InsumoId", "Tipo", "Quantidade", "DataHora", "Origem", "Observacao"
        ) VALUES (
            gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '44444444-4444-4444-4444-444444444444'::uuid,
            'ENTRADA', 10.0000, CURRENT_TIMESTAMP, 'COMPRA', 'Carga inicial de estoque para homologação'
        );
    END IF;

END $$;
