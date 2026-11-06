-- ==============================================================================
-- TESTES DISCRIMINATÓRIOS DE ROW-LEVEL SECURITY (RLS) - POSTGRESQL 16
-- Repositório: Gestao-Restaurante
-- ==============================================================================

\set ON_ERROR_STOP on

BEGIN;

-- Força execução como usuário de aplicação não-superuser para ativação de RLS
SET ROLE app_user;

-- 1. Criação de dois Inquilinos (Tenants) distintos para o teste discriminatório
INSERT INTO "Restaurantes" ("Id", "Nome", "Cnpj", "Cidade", "Estado", "Latitude", "Longitude", "Ativo", "CriadoEm")
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Restaurante Alpha RLS', '11111111000111', 'São Paulo', 'SP', -23.5505, -46.6333, true, NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Restaurante Beta RLS', '22222222000122', 'Rio de Janeiro', 'RJ', -22.9068, -43.1729, true, NOW())
ON CONFLICT ("Id") DO NOTHING;

-- 2. Teste Discriminatório 1: Gravação e Leitura no Contexto Tenant Alpha
SET LOCAL app.current_restaurante_id = '11111111-1111-1111-1111-111111111111';

INSERT INTO "Produtos" ("Id", "RestauranteId", "Nome", "Descricao", "Preco", "Ativo", "CriadoEm")
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Burger Alpha Especial', 'Burger artesanal 180g', 34.90, true, NOW())
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO "Insumos" ("Id", "RestauranteId", "Nome", "QuantidadeEstoque", "EstoqueMinimo", "UnidadeMedida", "CustoUnitario", "Ativo", "CriadoEm")
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Carne Bovina 180g Alpha', 50.0, 10.0, 'kg', 35.00, true, NOW())
ON CONFLICT ("Id") DO NOTHING;

-- Validação: Tenant Alpha deve enxergar exatamente seus registros
DO $$
DECLARE
  v_prod_count integer;
  v_insumo_count integer;
BEGIN
  SELECT count(*) INTO v_prod_count FROM "Produtos" WHERE "Id" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  SELECT count(*) INTO v_insumo_count FROM "Insumos" WHERE "Id" = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  
  IF v_prod_count <> 1 OR v_insumo_count <> 1 THEN
    RAISE EXCEPTION '[FALHA] Tenant Alpha deveria enxergar seus proprios registros inseridos (prod: %, insumo: %)', v_prod_count, v_insumo_count;
  END IF;
  RAISE NOTICE '[OK] Teste 1: Tenant Alpha le seus proprios registros com sucesso.';
END $$;

-- 3. Teste Discriminatório 2: Isolamento Estrito de Leitura no Contexto Tenant Beta (Zero Leakage)
SET LOCAL app.current_restaurante_id = '22222222-2222-2222-2222-222222222222';

DO $$
DECLARE
  v_prod_leak integer;
  v_insumo_leak integer;
BEGIN
  SELECT count(*) INTO v_prod_leak FROM "Produtos" WHERE "Id" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  SELECT count(*) INTO v_insumo_leak FROM "Insumos" WHERE "Id" = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  IF v_prod_leak <> 0 OR v_insumo_leak <> 0 THEN
    RAISE EXCEPTION '[FALHA CRITICA DE RLS] Vazamento cross-tenant detectado! Tenant Beta enxergou dados do Tenant Alpha (prod: %, insumo: %)', v_prod_leak, v_insumo_leak;
  END IF;
  RAISE NOTICE '[OK] Teste 2: Isolamento cross-tenant comprovado: Tenant Beta nao enxerga registros do Tenant Alpha.';
END $$;

-- 4. Teste Discriminatório 3: Tentativa de Manipulacao Cruzada (Cross-Tenant UPDATE / DELETE)
SET LOCAL app.current_restaurante_id = '22222222-2222-2222-2222-222222222222';

UPDATE "Produtos" SET "Preco" = 1.00 WHERE "Id" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
DELETE FROM "Insumos" WHERE "Id" = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- 5. Teste Discriminatório 4: Validação de que Tenant Alpha permaneceu inalterado após tentativa do Beta
SET LOCAL app.current_restaurante_id = '11111111-1111-1111-1111-111111111111';

DO $$
DECLARE
  v_preco numeric;
  v_insumo_count integer;
BEGIN
  SELECT "Preco" INTO v_preco FROM "Produtos" WHERE "Id" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  SELECT count(*) INTO v_insumo_count FROM "Insumos" WHERE "Id" = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  IF v_preco <> 34.90 THEN
    RAISE EXCEPTION '[FALHA] Preco do produto foi adulterado por cross-tenant update! Valor atual: %', v_preco;
  END IF;

  IF v_insumo_count <> 1 THEN
    RAISE EXCEPTION '[FALHA] Insumo foi deletado por cross-tenant delete!';
  END IF;

  RAISE NOTICE '[OK] Teste 3 & 4: UPDATE e DELETE cross-tenant foram descartados silenciosamente pelo RLS sem afetar Tenant Alpha.';
END $$;

-- 6. Teste Discriminatório 5: Tentativa de Cross-Tenant Ingestion (INSERT com IDOR forçado)
SET LOCAL app.current_restaurante_id = '22222222-2222-2222-2222-222222222222';

DO $$
BEGIN
  BEGIN
    INSERT INTO "Produtos" ("Id", "RestauranteId", "Nome", "Descricao", "Preco", "Ativo", "CriadoEm")
    VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Burger Invasao Maliciosa', 'Invasao', 15.00, true, NOW());
    RAISE EXCEPTION '[FALHA] RLS WITH CHECK deveria ter rejeitado o INSERT cross-tenant!';
  EXCEPTION 
    WHEN insufficient_privilege THEN
      RAISE NOTICE '[OK] Teste 5: PostgreSQL RLS WITH CHECK bloqueou tentativa de INSERT cross-tenant com codigo 42501 (insufficient_privilege).';
  END;
END $$;

-- 7. Teste Discriminatório 6: Fail-Closed em Sessão Anônima / Contexto Ausente
SET LOCAL app.current_restaurante_id = '';

DO $$
DECLARE
  v_total_produtos integer;
  v_total_insumos integer;
BEGIN
  SELECT count(*) INTO v_total_produtos FROM "Produtos";
  SELECT count(*) INTO v_total_insumos FROM "Insumos";

  IF v_total_produtos <> 0 OR v_total_insumos <> 0 THEN
    RAISE EXCEPTION '[FALHA] Contexto vazio/nulo vazou registros (produtos: %, insumos: %)!', v_total_produtos, v_total_insumos;
  END IF;

  RAISE NOTICE '[OK] Teste 6: Contexto vazio ou nulo e fail-closed (retorna estritamente 0 registros).';
END $$;

-- Rollback limpo para não deixar lixo de teste na base do docker
ROLLBACK;

-- Confirmação final
DO $$
BEGIN
  RAISE NOTICE '==============================================================================';
  RAISE NOTICE 'TODOS OS TESTES DISCRIMINATORIOS DE POSTGRESQL 16 COM RLS FORAM APROVADOS!';
  RAISE NOTICE '==============================================================================';
END $$;
