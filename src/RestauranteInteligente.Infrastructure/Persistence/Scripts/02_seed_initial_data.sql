-- ==============================================================================
-- Carga Inicial de Dados (Seed Declarativo) para Ambiente Docker / Homologação
-- Restaurante Padrão, Operador PDV, Catálogo, Insumos, BOM e Livro-Razão
-- Idempotência estrita garantida via ON CONFLICT DO NOTHING
-- ==============================================================================

-- 1. Estabelece escopo de tenant para satisfazer as políticas de FORCE ROW LEVEL SECURITY (RLS)
SET app.current_restaurante_id = '11111111-1111-1111-1111-111111111111';

-- 2. Inserção do Restaurante Padrão de Homologação
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
) ON CONFLICT ("Id") DO NOTHING;

-- 3. Inserção do Operador de Caixa / Administrador (Senha: 123456 via PBKDF2)
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
) ON CONFLICT ("Id") DO NOTHING;

-- 4. Inserção dos Insumos Críticos com Saldo 10 e Mínimo 5
INSERT INTO "Insumos" (
    "Id", "RestauranteId", "Nome", "UnidadeMedida", "QuantidadeEstoque", "EstoqueMinimo", "CustoUnitario", "Ativo", "CriadoEm"
) VALUES 
(
    '22222222-2222-2222-2222-222222222222'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Pão Brioche Artesanal',
    'UN',
    10.0000,
    5.0000,
    2.50,
    TRUE,
    CURRENT_TIMESTAMP
),
(
    '33333333-3333-3333-3333-333333333333'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Hambúrguer de Carne Angus 180g',
    'UN',
    10.0000,
    5.0000,
    8.00,
    TRUE,
    CURRENT_TIMESTAMP
),
(
    '44444444-4444-4444-4444-444444444444'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Queijo Cheddar Fatiado',
    'UN',
    10.0000,
    5.0000,
    1.50,
    TRUE,
    CURRENT_TIMESTAMP
) ON CONFLICT ("Id") DO NOTHING;

-- 5. Inserção do Catálogo de Produtos
INSERT INTO "Produtos" (
    "Id", "RestauranteId", "Nome", "Descricao", "Preco", "Ativo", "CriadoEm"
) VALUES 
(
    '55555555-5555-5555-5555-555555555555'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Hambúrguer Artesanal Supremo',
    'Delicioso hambúrguer artesanal com blend angus, pão brioche e queijo cheddar derretido.',
    38.00,
    TRUE,
    CURRENT_TIMESTAMP
),
(
    '55555555-5555-5555-5555-555555555552'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Double Smash Bacon',
    '2x blend smash 90g, muito bacon crocante e queijo prato.',
    42.00,
    TRUE,
    CURRENT_TIMESTAMP
),
(
    '55555555-5555-5555-5555-555555555553'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Batata Rústica Trufada',
    'Batatas crocantes com azeite trufado e queijo parmesão ralado.',
    26.50,
    TRUE,
    CURRENT_TIMESTAMP
),
(
    '55555555-5555-5555-5555-555555555554'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Onion Rings Crocantes',
    'Anéis de cebola empanados acompanhados de molho barbecue.',
    22.00,
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
    'Suco de Laranja Natural',
    'Suco integral 400ml preparado na hora.',
    12.00,
    TRUE,
    CURRENT_TIMESTAMP
),
(
    '55555555-5555-5555-5555-555555555558'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Pudim de Leite Artesanal',
    'Fatia individual de pudim tradicional com calda de caramelo.',
    14.00,
    TRUE,
    CURRENT_TIMESTAMP
),
(
    '55555555-5555-5555-5555-555555555559'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Brownie com Sorvete',
    'Brownie de chocolate belga aquecido com sorvete de creme.',
    18.90,
    TRUE,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("Id") DO NOTHING;

-- 6. Inserção da Ficha Técnica (BOM)
INSERT INTO "ProdutosInsumos" ("Id", "RestauranteId", "ProdutoId", "InsumoId", "Quantidade")
VALUES 
(
    '77777777-7777-7777-7777-777777777771'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    1.0000
),
(
    '77777777-7777-7777-7777-777777777772'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    1.0000
),
(
    '77777777-7777-7777-7777-777777777773'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '55555555-5555-5555-5555-555555555555'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    1.0000
) ON CONFLICT ("ProdutoId", "InsumoId") DO NOTHING;

-- 7. Lançamentos Iniciais no Livro-Razão Imutável (MovimentacoesEstoque)
INSERT INTO "MovimentacoesEstoque" (
    "Id", "RestauranteId", "InsumoId", "Tipo", "Quantidade", "DataHora", "Origem", "Observacao"
) VALUES 
(
    '66666666-6666-6666-6666-666666666661'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'ENTRADA',
    10.0000,
    CURRENT_TIMESTAMP,
    'COMPRA',
    'Carga inicial de estoque para homologação'
),
(
    '66666666-6666-6666-6666-666666666662'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '33333333-3333-3333-3333-333333333333'::uuid,
    'ENTRADA',
    10.0000,
    CURRENT_TIMESTAMP,
    'COMPRA',
    'Carga inicial de estoque para homologação'
),
(
    '66666666-6666-6666-6666-666666666663'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '44444444-4444-4444-4444-444444444444'::uuid,
    'ENTRADA',
    10.0000,
    CURRENT_TIMESTAMP,
    'COMPRA',
    'Carga inicial de estoque para homologação'
) ON CONFLICT ("Id") DO NOTHING;

-- 8. Inserção dos Planos Comerciais SaaS
INSERT INTO "Planos" (
    "Id", "Nome", "Descricao", "PrecoMensal", "PossuiModuloIa", "Ativo", "CriadoEm"
) VALUES 
(
    '11111111-1111-1111-1111-111111111111'::uuid,
    'Plano Starter',
    'Gestão operacional completa de estoque, caixa diário e controle financeiro.',
    99.00,
    FALSE,
    TRUE,
    CURRENT_TIMESTAMP
),
(
    '22222222-2222-2222-2222-222222222222'::uuid,
    'Plano Pro Inteligente (IA)',
    'Tudo do Starter + Previsão de Demanda com IA (HistGradientBoosting), meteorologia e alertas SSE em tempo real.',
    189.00,
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP
) ON CONFLICT ("Nome") DO NOTHING;

-- 9. Inserção da Assinatura SaaS Inicial para o Restaurante de Homologação (14 dias Free Trial)
INSERT INTO "Assinaturas" (
    "Id", "RestauranteId", "PlanoId", "Status", "DataInicio", "DataFimTrial", "DataExpiracao", "CriadoEm"
) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    'TRIAL',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '14 days',
    NULL,
    CURRENT_TIMESTAMP
) ON CONFLICT ("RestauranteId") DO NOTHING;

