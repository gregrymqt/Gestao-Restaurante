-- ==============================================================================
-- Script de Injeção de Carga Ilustrativa para Apresentação à Banca (TCC)
-- Insere Catálogo, Insumos Críticos, BOM, 30 Dias de Vendas e Caixa Ativo
-- Tabela 'Previsoes' permanece VAZIA para demonstração ao vivo do ML!
-- ==============================================================================

SET app.current_restaurante_id = '11111111-1111-1111-1111-111111111111';

-- 1. Restaurante Padrão
INSERT INTO "Restaurantes" ("Id", "Nome", "Cnpj", "Cidade", "Estado", "Latitude", "Longitude", "Ativo", "CriadoEm")
VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Restaurante Teste E2E',
    '12.345.678/0001-90',
    'São Paulo',
    'SP',
    -23.550520,
    -46.633308,
    TRUE,
    CURRENT_TIMESTAMP
) ON CONFLICT ("Id") DO NOTHING;

-- 2. Usuários (Gestor e Operador) - Senha: 123456
INSERT INTO "Usuarios" ("Id", "RestauranteId", "Nome", "Email", "SenhaHash", "Perfil", "Ativo", "CriadoEm")
VALUES 
(
    '88888888-8888-8888-8888-888888888888'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Gestor do Restaurante',
    'gestor@restaurante.com',
    '100000.mEZvy32kdsQSwv74NSu++g==.SrVf0vv/434/flq7xTUOzl62Aep2uce/m7HUvRkc3AY=',
    'Manager',
    TRUE,
    CURRENT_TIMESTAMP
),
(
    '99999999-9999-9999-9999-999999999999'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Operador de Caixa',
    'operador@restaurante.com',
    '100000.mEZvy32kdsQSwv74NSu++g==.SrVf0vv/434/flq7xTUOzl62Aep2uce/m7HUvRkc3AY=',
    'Operador',
    TRUE,
    CURRENT_TIMESTAMP
) ON CONFLICT ("Id") DO NOTHING;

-- 3. Insumos com Alertas Críticos Estratégicos
INSERT INTO "Insumos" ("Id", "RestauranteId", "Nome", "UnidadeMedida", "QuantidadeEstoque", "EstoqueMinimo", "CustoUnitario", "Ativo", "CriadoEm")
VALUES 
(
    '22222222-2222-2222-2222-222222222222'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Pão de Hambúrguer Brioche',
    'UN',
    18.0000, -- Crítico: Mínimo é 30
    30.0000,
    2.50,
    TRUE,
    CURRENT_TIMESTAMP
),
(
    '33333333-3333-3333-3333-333333333333'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Carne Bovina Moída (Blend)',
    'KG',
    3.2000, -- Crítico: Mínimo é 5.0
    5.0000,
    38.00,
    TRUE,
    CURRENT_TIMESTAMP
),
(
    '44444444-4444-4444-4444-444444444444'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Queijo Cheddar Fatiado',
    'UN',
    120.0000,
    20.0000,
    1.20,
    TRUE,
    CURRENT_TIMESTAMP
),
(
    '55555555-5555-5555-5555-555555555551'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Bacon Defumado Especial',
    'KG',
    15.0000,
    3.0000,
    42.00,
    TRUE,
    CURRENT_TIMESTAMP
),
(
    '55555555-5555-5555-5555-555555555552'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Batata Especial para Fritura',
    'KG',
    45.0000,
    10.0000,
    8.50,
    TRUE,
    CURRENT_TIMESTAMP
),
(
    '55555555-5555-5555-5555-555555555553'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Refrigerante Lata 350ml',
    'UN',
    96.0000,
    24.0000,
    3.50,
    TRUE,
    CURRENT_TIMESTAMP
),
(
    '55555555-5555-5555-5555-555555555554'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Laranja Pera In Natura',
    'KG',
    35.0000,
    10.0000,
    5.00,
    TRUE,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("Id") DO UPDATE SET 
    "QuantidadeEstoque" = EXCLUDED."QuantidadeEstoque",
    "EstoqueMinimo" = EXCLUDED."EstoqueMinimo";

-- 4. Produtos Comerciais do Cardápio
INSERT INTO "Produtos" ("Id", "RestauranteId", "Nome", "Descricao", "Preco", "Ativo", "CriadoEm")
VALUES 
(
    '55555555-5555-5555-5555-555555555555'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Hambúrguer Artesanal Supremo',
    'Delicioso hambúrguer artesanal com blend angus, pão brioche e queijo cheddar.',
    38.00,
    TRUE,
    CURRENT_TIMESTAMP
),
(
    '55555555-5555-5555-5555-555555555556'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Refrigerante Lata 350ml',
    'Coca-Cola, Guaraná Antarctica ou Água Tônica.',
    7.50,
    TRUE,
    CURRENT_TIMESTAMP
),
(
    '55555555-5555-5555-5555-555555555557'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Double Smash Bacon',
    '2x blend smash 90g, muito bacon crocante e queijo prato.',
    42.00,
    TRUE,
    CURRENT_TIMESTAMP
),
(
    '55555555-5555-5555-5555-555555555558'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Batata Rústica Trufada',
    'Porção generosa de batatas rústicas com azeite de trufas e alecrim fresco.',
    24.00,
    TRUE,
    CURRENT_TIMESTAMP
),
(
    '55555555-5555-5555-5555-555555555559'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Suco de Laranja Natural',
    'Suco integral 400ml preparado na hora.',
    12.00,
    TRUE,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("Id") DO UPDATE SET "Preco" = EXCLUDED."Preco";

-- 5. Ficha Técnica (BOM / ProdutosInsumos)
INSERT INTO "ProdutosInsumos" ("Id", "RestauranteId", "ProdutoId", "InsumoId", "Quantidade")
VALUES 
-- Hambúrguer Artesanal Supremo
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555555'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 1.0000), -- 1x Pão Brioche
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555555'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 0.1800), -- 180g Carne
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555555'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 2.0000), -- 2x Queijo
-- Double Smash Bacon
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555557'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 1.0000), -- 1x Pão Brioche
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555557'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 0.1800), -- 180g Carne
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555557'::uuid, '44444444-4444-4444-4444-444444444444'::uuid, 2.0000), -- 2x Queijo
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555557'::uuid, '55555555-5555-5555-5555-555555555551'::uuid, 0.0500), -- 50g Bacon
-- Batata Rústica
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555558'::uuid, '55555555-5555-5555-5555-555555555552'::uuid, 0.3500), -- 350g Batata
-- Refrigerante Lata
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555556'::uuid, '55555555-5555-5555-5555-555555555553'::uuid, 1.0000), -- 1x Refri
-- Suco Natural
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555559'::uuid, '55555555-5555-5555-5555-555555555554'::uuid, 0.4000)  -- 400g Laranja
ON CONFLICT ("ProdutoId", "InsumoId") DO NOTHING;

-- 6. Sessão de Caixa Aberto para Hoje
INSERT INTO "FechamentosCaixa" ("Id", "RestauranteId", "UsuarioId", "DataAbertura", "ValorTotalVendas", "QuantidadeVendas", "Status", "CriadoEm")
VALUES (
    '8b7bb140-4f97-4330-8a94-cdd3dd0757c5'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '88888888-8888-8888-8888-888888888888'::uuid,
    CURRENT_DATE + TIME '08:00:00',
    327.00,
    3,
    'ABERTO',
    CURRENT_TIMESTAMP
) ON CONFLICT ("Id") DO UPDATE SET "Status" = 'ABERTO', "ValorTotalVendas" = 327.00, "QuantidadeVendas" = 3;

-- 7. Vendas Concluídas do Dia de Hoje
INSERT INTO "Vendas" ("Id", "RestauranteId", "FechamentoCaixaId", "DataHora", "ValorTotal", "StatusPreparo", "FormaPagamento", "Status", "CriadoEm")
VALUES 
(
    'a1111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '8b7bb140-4f97-4330-8a94-cdd3dd0757c5'::uuid,
    CURRENT_TIMESTAMP - INTERVAL '16 minutes',
    76.00, 'PRONTO',
    'PIX',
    'CONCLUIDA',
    CURRENT_TIMESTAMP
),
(
    'a2222222-2222-2222-2222-222222222222'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '8b7bb140-4f97-4330-8a94-cdd3dd0757c5'::uuid,
    CURRENT_TIMESTAMP - INTERVAL '11 minutes',
    141.00, 'EM_PREPARO',
    'CARTAO',
    'CONCLUIDA',
    CURRENT_TIMESTAMP
),
(
    'a3333333-3333-3333-3333-333333333333'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '8b7bb140-4f97-4330-8a94-cdd3dd0757c5'::uuid,
    CURRENT_TIMESTAMP - INTERVAL '3 minutes',
    110.00, 'RECEBIDO',
    'Dinheiro',
    'CONCLUIDA',
    CURRENT_TIMESTAMP
) ON CONFLICT ("Id") DO NOTHING;

-- Itens das Vendas de Hoje
INSERT INTO "ItensVenda" ("Id", "RestauranteId", "VendaId", "ProdutoId", "Quantidade", "PrecoUnitario", "Subtotal")
VALUES 
-- Venda 1: 2x Hambúrguer Supremo
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, 'a1111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555555'::uuid, 2.0000, 38.00, 76.00),
-- Venda 2: 3x Double Smash Bacon + 2x Refri
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, 'a2222222-2222-2222-2222-222222222222'::uuid, '55555555-5555-5555-5555-555555555552'::uuid, 3.0000, 42.00, 126.00),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, 'a2222222-2222-2222-2222-222222222222'::uuid, '55555555-5555-5555-5555-555555555556'::uuid, 2.0000, 7.50, 15.00),
-- Venda 3: 2x Batata Rústica + 2x Suco + 1x Hambúrguer Supremo
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, 'a3333333-3333-3333-3333-333333333333'::uuid, '55555555-5555-5555-5555-555555555553'::uuid, 2.0000, 24.00, 48.00),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, 'a3333333-3333-3333-3333-333333333333'::uuid, '55555555-5555-5555-5555-555555555557'::uuid, 2.0000, 12.00, 24.00),
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, 'a3333333-3333-3333-3333-333333333333'::uuid, '55555555-5555-5555-5555-555555555555'::uuid, 1.0000, 38.00, 38.00)
ON CONFLICT ("Id") DO NOTHING;

-- Adiciona tags de modificadores nas comandas demonstrativas de hoje para o KDS
UPDATE "ItensVenda"
SET "ModificadoresJson" = '[{"Nome":"Ao Ponto (Rosado e Suculento)","TipoAcao":"Culinario","PrecoAdicional":0},{"Nome":"Sem Cebola","TipoAcao":"Remocao","PrecoAdicional":0}]'
WHERE "VendaId" = 'a1111111-1111-1111-1111-111111111111'::uuid
  AND "ProdutoId" = '55555555-5555-5555-5555-555555555555'::uuid;

UPDATE "ItensVenda"
SET "ModificadoresJson" = '[{"Nome":"Bem Passado (Sem Sangue)","TipoAcao":"Culinario","PrecoAdicional":0},{"Nome":"+ Bacon Fatiado Defumado","TipoAcao":"Adicional","PrecoAdicional":4.50}]'
WHERE "VendaId" = 'a2222222-2222-2222-2222-222222222222'::uuid
  AND "ProdutoId" = '55555555-5555-5555-5555-555555555552'::uuid;

UPDATE "ItensVenda"
SET "ModificadoresJson" = '[{"Nome":"Mal Passado (Selado por Fora)","TipoAcao":"Culinario","PrecoAdicional":0},{"Nome":"Sem Picles","TipoAcao":"Remocao","PrecoAdicional":0}]'
WHERE "VendaId" = 'a3333333-3333-3333-3333-333333333333'::uuid
  AND "ProdutoId" = '55555555-5555-5555-5555-555555555555'::uuid;

-- 8. Série Temporal Histórica de Vendas (30 Dias Anteriores)
DO $$
DECLARE
    v_data_cursor DATE;
    v_venda_id UUID;
    v_caixa_id UUID;
    v_dias_offset INT;
    v_qtd_vendas INT;
    v_i INT;
    v_forma_pgto TEXT;
    v_prod_id UUID;
    v_preco NUMERIC(18,2);
    v_qtd NUMERIC(18,4);
BEGIN
    FOR v_dias_offset IN 1..30 LOOP
        v_data_cursor := CURRENT_DATE - v_dias_offset;
        v_caixa_id := gen_random_uuid();

        -- Cria fechamento diário
        INSERT INTO "FechamentosCaixa" ("Id", "RestauranteId", "UsuarioId", "DataAbertura", "DataFechamento", "ValorTotalVendas", "QuantidadeVendas", "Status", "CriadoEm")
        VALUES (
            v_caixa_id,
            '11111111-1111-1111-1111-111111111111'::uuid,
            '88888888-8888-8888-8888-888888888888'::uuid,
            v_data_cursor + TIME '08:00:00',
            v_data_cursor + TIME '23:00:00',
            0,
            0,
            'FECHADO',
            CURRENT_TIMESTAMP
        );

        IF EXTRACT(DOW FROM v_data_cursor) IN (5, 6) THEN
            v_qtd_vendas := 8 + (v_dias_offset % 5);
        ELSE
            v_qtd_vendas := 4 + (v_dias_offset % 3);
        END IF;

        FOR v_i IN 1..v_qtd_vendas LOOP
            v_venda_id := gen_random_uuid();
            v_forma_pgto := CASE (v_i % 3)
                WHEN 0 THEN 'PIX'
                WHEN 1 THEN 'CARTAO'
                ELSE 'Dinheiro'
            END;

            CASE (v_i % 5)
                WHEN 0 THEN
                    v_prod_id := '55555555-5555-5555-5555-555555555555'::uuid; -- Hambúrguer Supremo
                    v_preco := 38.00;
                    v_qtd := 1.0;
                WHEN 1 THEN
                    v_prod_id := '55555555-5555-5555-5555-555555555557'::uuid; -- Double Smash
                    v_preco := 42.00;
                    v_qtd := 1.0;
                WHEN 2 THEN
                    v_prod_id := '55555555-5555-5555-5555-555555555558'::uuid; -- Batata Rústica
                    v_preco := 24.00;
                    v_qtd := 1.0;
                WHEN 3 THEN
                    v_prod_id := '55555555-5555-5555-5555-555555555556'::uuid; -- Refrigerante
                    v_preco := 7.50;
                    v_qtd := 2.0;
                ELSE
                    v_prod_id := '55555555-5555-5555-5555-555555555559'::uuid; -- Suco
                    v_preco := 12.00;
                    v_qtd := 1.0;
            END CASE;

            INSERT INTO "Vendas" ("Id", "RestauranteId", "FechamentoCaixaId", "DataHora", "Status", "StatusPreparo", "FormaPagamento", "ValorTotal", "CriadoEm")
            VALUES (
                v_venda_id,
                '11111111-1111-1111-1111-111111111111'::uuid,
                v_caixa_id,
                v_data_cursor + ((11 + (v_i % 10)) || ' hours')::interval,
                'CONCLUIDA',
                'ENTREGUE',
                v_forma_pgto,
                v_preco * v_qtd,
                CURRENT_TIMESTAMP
            );

            INSERT INTO "ItensVenda" ("Id", "RestauranteId", "VendaId", "ProdutoId", "Quantidade", "PrecoUnitario", "Subtotal")
            VALUES (
                gen_random_uuid(),
                '11111111-1111-1111-1111-111111111111'::uuid,
                v_venda_id,
                v_prod_id,
                v_qtd,
                v_preco,
                v_preco * v_qtd
            );
        END LOOP;

        UPDATE "FechamentosCaixa"
        SET 
            "ValorTotalVendas" = (SELECT COALESCE(SUM("ValorTotal"), 0) FROM "Vendas" WHERE "FechamentoCaixaId" = v_caixa_id),
            "QuantidadeVendas" = (SELECT COUNT(*) FROM "Vendas" WHERE "FechamentoCaixaId" = v_caixa_id)
        WHERE "Id" = v_caixa_id;
    END LOOP;
END $$;

-- 9. Dados Climáticos para os Últimos 30 Dias e Previsão para Amanhã
DO $$
DECLARE
    v_dia DATE;
    v_offset INT;
    v_temp NUMERIC(5,2);
    v_precip NUMERIC(5,2);
BEGIN
    FOR v_offset IN 0..30 LOOP
        v_dia := CURRENT_DATE - v_offset;
        v_temp := 22.0 + (v_offset % 8);
        v_precip := CASE WHEN v_offset % 4 = 0 THEN 14.5 ELSE 0.0 END;

        INSERT INTO "DadosClimaticos" ("Id", "RestauranteId", "Data", "Temperatura", "Umidade", "Precipitacao", "CondicaoClimatica", "Fonte", "TipoDado", "ConsultadoEm")
        VALUES (
            gen_random_uuid(),
            '11111111-1111-1111-1111-111111111111'::uuid,
            v_dia,
            v_temp,
            65.0,
            v_precip,
            CASE WHEN v_precip > 0 THEN 'Chuvoso' ELSE 'Ensolarado' END,
            'Open-Meteo',
            'HISTORICO',
            CURRENT_TIMESTAMP
        ) ON CONFLICT ("RestauranteId", "Data") DO NOTHING;
    END LOOP;

    -- Previsão para Amanhã (D+1)
    INSERT INTO "DadosClimaticos" ("Id", "RestauranteId", "Data", "Temperatura", "Umidade", "Precipitacao", "CondicaoClimatica", "Fonte", "TipoDado", "ConsultadoEm")
    VALUES (
        gen_random_uuid(),
        '11111111-1111-1111-1111-111111111111'::uuid,
        CURRENT_DATE + 1,
        25.0,
        60.0,
        0.0,
        'Céu Limpo',
        'Open-Meteo',
        'PREVISAO',
        CURRENT_TIMESTAMP
    ) ON CONFLICT ("RestauranteId", "Data") DO UPDATE SET "TipoDado" = 'PREVISAO';
END $$;

-- 10. CLÁUSULA MANDATÓRIA: Tabela 'Previsoes' limpa para demonstração da IA ao vivo!
DELETE FROM "Previsoes" 
WHERE "RestauranteId" = '11111111-1111-1111-1111-111111111111'::uuid;

-- 11. Grupos de Modificadores e Opções (Ponto da Carne, Observações e Adicionais)
INSERT INTO "GruposModificadores" (
    "Id", "RestauranteId", "Nome", "Descricao", "Obrigatorio", "MinimoSelecoes", "MaximoSelecoes", "Ativo"
) VALUES 
(
    'aa111111-1111-1111-1111-111111111111'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Ponto da Carne',
    'Escolha exatamente o ponto desejado',
    TRUE,
    1,
    1,
    TRUE
),
(
    'aa222222-2222-2222-2222-222222222222'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Observações de Cozinha',
    'Retire ingredientes que não deseja',
    FALSE,
    0,
    3,
    TRUE
),
(
    'aa333333-3333-3333-3333-333333333333'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Adicionais Especiais',
    'Turbine seu pedido com ingredientes extras',
    FALSE,
    0,
    3,
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
    1,
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
    1,
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
    1,
    TRUE
),
(
    'bb222222-2222-2222-2222-222222222221'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'aa222222-2222-2222-2222-222222222222'::uuid,
    'Sem Cebola',
    0.00,
    NULL,
    0.0000,
    3,
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
    3,
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
    3,
    TRUE
),
(
    'bb333333-3333-3333-3333-333333333331'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'aa333333-3333-3333-3333-333333333333'::uuid,
    '+ Bacon Fatiado Defumado',
    4.50,
    '33333333-3333-3333-3333-333333333333'::uuid,
    0.0400,
    2,
    TRUE
),
(
    'bb333333-3333-3333-3333-333333333332'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'aa333333-3333-3333-3333-333333333333'::uuid,
    '+ Queijo Cheddar Extra',
    3.50,
    '44444444-4444-4444-4444-444444444444'::uuid,
    0.0300,
    2,
    TRUE
) ON CONFLICT ("Id") DO NOTHING;

-- Vínculo com os Burgers do Catálogo
INSERT INTO "ProdutosGruposModificadores" ("Id", "RestauranteId", "ProdutoId", "GrupoModificadorId", "OrdemExibicao")
VALUES 
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '3abeb11d-fdeb-4755-b797-6e5ad1a48e52'::uuid, 'aa111111-1111-1111-1111-111111111111'::uuid, 1),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '3abeb11d-fdeb-4755-b797-6e5ad1a48e52'::uuid, 'aa222222-2222-2222-2222-222222222222'::uuid, 2),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '3abeb11d-fdeb-4755-b797-6e5ad1a48e52'::uuid, 'aa333333-3333-3333-3333-333333333333'::uuid, 3),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555552'::uuid, 'aa111111-1111-1111-1111-111111111111'::uuid, 1),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555552'::uuid, 'aa222222-2222-2222-2222-222222222222'::uuid, 2),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, '55555555-5555-5555-5555-555555555552'::uuid, 'aa333333-3333-3333-3333-333333333333'::uuid, 3)
ON CONFLICT ("ProdutoId", "GrupoModificadorId") DO NOTHING;
