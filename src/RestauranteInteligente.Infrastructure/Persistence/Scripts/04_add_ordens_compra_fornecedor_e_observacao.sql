-- 04_add_ordens_compra_fornecedor_e_observacao.sql
-- Adiciona colunas para ciclo de vida de compras (Fornecedor, Observacao, AtualizadoEm) na tabela OrdensCompra

ALTER TABLE "OrdensCompra" ADD COLUMN IF NOT EXISTS "Fornecedor" VARCHAR(150) NULL;
ALTER TABLE "OrdensCompra" ADD COLUMN IF NOT EXISTS "Observacao" VARCHAR(500) NULL;
ALTER TABLE "OrdensCompra" ADD COLUMN IF NOT EXISTS "AtualizadoEm" TIMESTAMPTZ NULL;
