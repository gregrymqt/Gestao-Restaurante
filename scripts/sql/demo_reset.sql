-- ==============================================================================
-- Script de Reset Cirúrgico Operacional (Demonstração / Banca TCC)
-- Limpa dados transacionais preservando o Restaurante, Usuários e Planos
-- ==============================================================================

SET app.current_restaurante_id = '11111111-1111-1111-1111-111111111111';

-- 1. Limpeza de itens e vendas do tenant
DELETE FROM "ItensVenda" 
WHERE "VendaId" IN (SELECT "Id" FROM "Vendas" WHERE "RestauranteId" = '11111111-1111-1111-1111-111111111111'::uuid);

DELETE FROM "Vendas" 
WHERE "RestauranteId" = '11111111-1111-1111-1111-111111111111'::uuid;

-- 2. Limpeza do livro-razão de estoque
DELETE FROM "MovimentacoesEstoque" 
WHERE "RestauranteId" = '11111111-1111-1111-1111-111111111111'::uuid;

-- 3. Limpeza das sessões de caixa
DELETE FROM "FechamentosCaixa" 
WHERE "RestauranteId" = '11111111-1111-1111-1111-111111111111'::uuid;

-- 4. Limpeza de previsões de IA geradas anteriormente
DELETE FROM "Previsoes" 
WHERE "RestauranteId" = '11111111-1111-1111-1111-111111111111'::uuid;

-- 5. Limpeza de séries climáticas
DELETE FROM "DadosClimaticos" 
WHERE "RestauranteId" = '11111111-1111-1111-1111-111111111111'::uuid;

-- 6. Zera saldos materializados dos insumos
UPDATE "Insumos" 
SET "QuantidadeEstoque" = 0.0000 
WHERE "RestauranteId" = '11111111-1111-1111-1111-111111111111'::uuid;
