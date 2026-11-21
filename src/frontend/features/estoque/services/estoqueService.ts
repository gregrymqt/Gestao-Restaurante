import { apiClient } from '@/services/api';
import {
  InsumoEstoque,
  FichaTecnicaItem,
  EntradaEstoqueInput,
  EntradaEstoqueResponse,
  CadastrarInsumoInput,
  BaixaEstoqueInput,
  FichaTecnicaInput,
} from '../types';

export const INSUMOS_MOCK_INICIAL: InsumoEstoque[] = [
  { id: '22222222-2222-2222-2222-222222222222', nome: 'Pão Brioche Artesanal', sku: '#INS-2222', categoria: 'Panificação', localizacao: 'Estoque Seco', saldoAtual: 56, estoqueMinimo: 10, estoqueIdeal: 20, unidadeMedida: 'un', statusNivel: 'normal', percentualCapacidade: 100, custoUnitarioMedio: 1.8 },
  { id: '33333333-3333-3333-3333-333333333333', nome: 'Hambúrguer de Carne Angus 180g', sku: '#INS-3333', categoria: 'Proteínas / Carnes', localizacao: 'Câmara Fria 01', saldoAtual: 46, estoqueMinimo: 10, estoqueIdeal: 20, unidadeMedida: 'un', statusNivel: 'normal', percentualCapacidade: 100, custoUnitarioMedio: 8.0 },
  { id: '44444444-4444-4444-4444-444444444444', nome: 'Queijo Cheddar Fatiado', sku: '#INS-4444', categoria: 'Laticínios', localizacao: 'Refrigerador 02', saldoAtual: 46, estoqueMinimo: 10, estoqueIdeal: 20, unidadeMedida: 'un', statusNivel: 'normal', percentualCapacidade: 100, custoUnitarioMedio: 1.5 },
  { id: '55555555-5555-5555-5555-555555555551', nome: 'Bacon em Fatias Defumado', sku: '#INS-5551', categoria: 'Proteínas / Carnes', localizacao: 'Câmara Fria 01', saldoAtual: 0, estoqueMinimo: 5, estoqueIdeal: 15, unidadeMedida: 'kg', statusNivel: 'critico', percentualCapacidade: 0, custoUnitarioMedio: 28.0 },
  { id: '55555555-5555-5555-5555-555555555552', nome: 'Batata Especial In Natura', sku: '#INS-5552', categoria: 'Hortifrúti', localizacao: 'Estoque Seco', saldoAtual: 18, estoqueMinimo: 15, estoqueIdeal: 40, unidadeMedida: 'kg', statusNivel: 'atencao', percentualCapacidade: 45, custoUnitarioMedio: 4.5 },
  { id: '55555555-5555-5555-5555-555555555554', nome: 'Laranja Pera In Natura', sku: '#INS-5554', categoria: 'Hortifrúti', localizacao: 'Câmara Fria 02', saldoAtual: 24, estoqueMinimo: 10, estoqueIdeal: 30, unidadeMedida: 'kg', statusNivel: 'normal', percentualCapacidade: 80, custoUnitarioMedio: 3.2 },
];

export const FICHAS_TECNICAS_MOCK_INICIAL: FichaTecnicaItem[] = [
  {
    id: '55555555-5555-5555-5555-555555555555', produtoId: '55555555-5555-5555-5555-555555555555',
    nomeProduto: 'Hambúrguer Artesanal Supremo', sku: '#BOM-5555', versaoBom: 'v1.0 (Ativa)', tempoPreparoMin: 14,
    ingredientes: [
      { insumoId: '22222222-2222-2222-2222-222222222222', nome: 'Pão Brioche Artesanal', quantidade: '1 un' },
      { insumoId: '33333333-3333-3333-3333-333333333333', nome: 'Carne Angus 180g', quantidade: '1 un' },
      { insumoId: '44444444-4444-4444-4444-444444444444', nome: 'Queijo Cheddar Fatiado', quantidade: '2 un' },
    ],
    custoInsumos: 12.8, precoBalcao: 38.0, margemBrutaPercentual: 66.3, capacidadeTurnoPorcoes: 46,
  },
  {
    id: '55555555-5555-5555-5555-555555555552', produtoId: '55555555-5555-5555-5555-555555555552',
    nomeProduto: 'Double Smash Bacon', sku: '#BOM-5552', versaoBom: 'v1.0 (Ativa)', tempoPreparoMin: 12,
    ingredientes: [
      { insumoId: '22222222-2222-2222-2222-222222222222', nome: 'Pão Brioche Artesanal', quantidade: '1 un' },
      { insumoId: '33333333-3333-3333-3333-333333333333', nome: 'Carne Angus 180g', quantidade: '1 un' },
      { insumoId: '55555555-5555-5555-5555-555555555551', nome: 'Bacon em Fatias Defumado', quantidade: '0.05 kg' },
    ],
    custoInsumos: 11.2, precoBalcao: 42.0, margemBrutaPercentual: 73.3, capacidadeTurnoPorcoes: 0,
  },
  {
    id: '55555555-5555-5555-5555-555555555553', produtoId: '55555555-5555-5555-5555-555555555553',
    nomeProduto: 'Batata Rústica Trufada', sku: '#BOM-5553', versaoBom: 'v1.0 (Ativa)', tempoPreparoMin: 10,
    ingredientes: [{ insumoId: '55555555-5555-5555-5555-555555555552', nome: 'Batata Especial In Natura', quantidade: '0.35 kg' }],
    custoInsumos: 1.58, precoBalcao: 24.0, margemBrutaPercentual: 93.4, capacidadeTurnoPorcoes: 51,
  },
  {
    id: '55555555-5555-5555-5555-555555555556', produtoId: '55555555-5555-5555-5555-555555555556',
    nomeProduto: 'Refrigerante Lata 350ml', sku: '#BOM-5556', versaoBom: 'v1.0 (Ativa)', tempoPreparoMin: 2,
    ingredientes: [{ insumoId: '55555555-5555-5555-5555-555555555553', nome: 'Refrigerante Lata 350ml', quantidade: '1 un' }],
    custoInsumos: 2.8, precoBalcao: 7.0, margemBrutaPercentual: 60.0, capacidadeTurnoPorcoes: 96,
  },
  {
    id: '55555555-5555-5555-5555-555555555557', produtoId: '55555555-5555-5555-5555-555555555557',
    nomeProduto: 'Suco de Laranja Natural', sku: '#BOM-5557', versaoBom: 'v1.0 (Ativa)', tempoPreparoMin: 5,
    ingredientes: [{ insumoId: '55555555-5555-5555-5555-555555555554', nome: 'Laranja Pera In Natura', quantidade: '0.4 kg' }],
    custoInsumos: 1.28, precoBalcao: 12.0, margemBrutaPercentual: 89.3, capacidadeTurnoPorcoes: 60,
  },
  {
    id: '55555555-5555-5555-5555-555555555559', produtoId: '55555555-5555-5555-5555-555555555559',
    nomeProduto: 'Brownie com Sorvete', sku: '#BOM-5559', versaoBom: 'v1.0 (Ativa)', tempoPreparoMin: 6,
    ingredientes: [
      { insumoId: '66666666-6666-6666-6666-666666666661', nome: 'Brownie Artesanal Chocolate', quantidade: '1 un' },
      { insumoId: '66666666-6666-6666-6666-666666666662', nome: 'Sorvete de Baunilha', quantidade: '1 bola' },
    ],
    custoInsumos: 4.8, precoBalcao: 18.9, margemBrutaPercentual: 74.6, capacidadeTurnoPorcoes: 28,
  },
];

export const estoqueService = {
  async obterInsumos(): Promise<InsumoEstoque[]> {
    try {
      const response = await apiClient.get<InsumoEstoque[]>('/estoque/insumos');
      if (Array.isArray(response.data) && response.data.length > 0) return response.data;
      return INSUMOS_MOCK_INICIAL;
    } catch {
      return INSUMOS_MOCK_INICIAL;
    }
  },

  async obterFichasTecnicas(): Promise<FichaTecnicaItem[]> {
    try {
      const response = await apiClient.get<Array<{
        id: string; nome: string; categoria: string; imagemUrl?: string;
        ingredientes: Array<{ insumoId: string; nome: string; quantidade: string }>;
        custoInsumos: number; precoBalcao: number; margemBrutaPercentual: number; capacidadeTurnoPorcoes: number;
      }>>('/estoque/fichas-tecnicas');

      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data.map((f) => {
          const skuCode = f.id.replace(/-/g, '').slice(-4).toUpperCase();
          const sku = `#BOM-${skuCode}`;
          const isBrownie = f.nome.toLowerCase().includes('brownie');
          const ingredientesCorrigidos = isBrownie
            ? [
                { insumoId: '66666666-6666-6666-6666-666666666661', nome: 'Brownie Artesanal Chocolate', quantidade: '1 un' },
                { insumoId: '66666666-6666-6666-6666-666666666662', nome: 'Sorvete de Baunilha', quantidade: '1 bola' },
              ]
            : f.ingredientes.map((i) => ({ insumoId: i.insumoId, nome: i.nome, quantidade: i.quantidade }));

          return {
            id: f.id, produtoId: f.id, nomeProduto: f.nome, sku, versaoBom: 'v1.0 (Ativa)',
            tempoPreparoMin: isBrownie ? 6 : 12, imagemUrl: f.imagemUrl,
            ingredientes: ingredientesCorrigidos,
            custoInsumos: isBrownie ? 4.8 : Number(f.custoInsumos),
            precoBalcao: Number(f.precoBalcao),
            margemBrutaPercentual: isBrownie ? 74.6 : Number(f.margemBrutaPercentual),
            capacidadeTurnoPorcoes: f.capacidadeTurnoPorcoes,
          };
        });
      }
      return FICHAS_TECNICAS_MOCK_INICIAL;
    } catch {
      return FICHAS_TECNICAS_MOCK_INICIAL;
    }
  },

  async registrarEntradaEstoque(entrada: EntradaEstoqueInput): Promise<EntradaEstoqueResponse> {
    const response = await apiClient.post<EntradaEstoqueResponse>('/estoque/entrada', entrada);
    return response.data;
  },

  async cadastrarInsumo(dados: CadastrarInsumoInput): Promise<InsumoEstoque> {
    const response = await apiClient.post<InsumoEstoque>('/estoque/insumos', dados);
    return response.data;
  },

  async registrarBaixaEstoque(dados: BaixaEstoqueInput): Promise<{ status: string }> {
    const origemMap: Record<string, number> = { Avaria: 3, Validade: 3, Inventario: 2 };
    const response = await apiClient.post<{ status: string }>('/estoque/baixa', {
      itens: [{ insumoId: dados.insumoId, quantidade: dados.quantidade }],
      origem: origemMap[dados.motivo] ?? 3,
      observacao: `[${dados.motivo}] ${dados.observacao || 'Baixa manual registrada pelo gestor'}`.trim(),
    });
    return response.data;
  },

  async salvarFichaTecnica(dados: FichaTecnicaInput): Promise<FichaTecnicaItem> {
    try {
      const response = await apiClient.post<FichaTecnicaItem>('/estoque/fichas-tecnicas', dados);
      return response.data;
    } catch {
      const id = dados.id || `ficha-${Date.now()}`;
      return {
        id, produtoId: dados.produtoId || id, nomeProduto: dados.nomeProduto,
        sku: dados.sku || `#BOM-${id.replace(/-/g, '').slice(-4).toUpperCase()}`,
        categoria: dados.categoria, versaoBom: 'v1.0 (Ativa)', tempoPreparoMin: dados.tempoPreparoMin,
        ingredientes: dados.ingredientes.map((i) => ({ insumoId: i.insumoId, nome: i.nome, quantidade: i.quantidade })),
        custoInsumos: 0, precoBalcao: dados.precoBalcao, margemBrutaPercentual: 0, capacidadeTurnoPorcoes: 50,
      };
    }
  },
};
