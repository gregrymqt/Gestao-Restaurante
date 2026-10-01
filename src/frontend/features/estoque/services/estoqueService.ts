import { apiClient } from '@/services/api';
import {
  InsumoEstoque,
  FichaTecnicaItem,
  EntradaEstoqueInput,
  EntradaEstoqueResponse,
  CadastrarInsumoInput,
  BaixaEstoqueInput,
} from '../types';

export const INSUMOS_MOCK_INICIAL: InsumoEstoque[] = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    nome: 'Pão Brioche Artesanal',
    sku: '#INS-2222',
    categoria: 'Panificação',
    localizacao: 'Estoque Seco',
    saldoAtual: 56,
    estoqueMinimo: 10,
    estoqueIdeal: 20,
    unidadeMedida: 'un',
    statusNivel: 'normal',
    percentualCapacidade: 100.0,
    custoUnitarioMedio: 2.5,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    nome: 'Hambúrguer de Carne Angus 180g',
    sku: '#INS-3333',
    categoria: 'Proteínas / Carnes',
    localizacao: 'Câmara Fria 01',
    saldoAtual: 46,
    estoqueMinimo: 10,
    estoqueIdeal: 20,
    unidadeMedida: 'un',
    statusNivel: 'normal',
    percentualCapacidade: 100.0,
    custoUnitarioMedio: 8.0,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    nome: 'Queijo Cheddar Fatiado',
    sku: '#INS-4444',
    categoria: 'Laticínios',
    localizacao: 'Refrigerador 02',
    saldoAtual: 46,
    estoqueMinimo: 10,
    estoqueIdeal: 20,
    unidadeMedida: 'un',
    statusNivel: 'normal',
    percentualCapacidade: 100.0,
    custoUnitarioMedio: 1.5,
  },
];

export const FICHAS_TECNICAS_MOCK_INICIAL: FichaTecnicaItem[] = [
  {
    id: '55555555-5555-5555-5555-555555555555',
    produtoId: '55555555-5555-5555-5555-555555555555',
    nomeProduto: 'Hambúrguer Artesanal Supremo',
    sku: '#BOM-5555',
    versaoBom: 'v1.0 (Ativa)',
    tempoPreparoMin: 14,
    ingredientes: [
      { insumoId: '22222222-2222-2222-2222-222222222222', nome: 'Pão Brioche Artesanal', quantidade: '1 un' },
      { insumoId: '33333333-3333-3333-3333-333333333333', nome: 'Carne Angus 180g', quantidade: '1 un' },
      { insumoId: '44444444-4444-4444-4444-444444444444', nome: 'Queijo Cheddar Fatiado', quantidade: '1 un' },
    ],
    custoInsumos: 12.0,
    precoBalcao: 38.0,
    margemBrutaPercentual: 68.4,
    capacidadeTurnoPorcoes: 46,
  },
];

export const estoqueService = {
  async obterInsumos(): Promise<InsumoEstoque[]> {
    try {
      const response = await apiClient.get<InsumoEstoque[]>('/estoque/insumos');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return INSUMOS_MOCK_INICIAL;
    } catch (error) {
      console.warn('Falha ao obter insumos da API. Utilizando dados locais de fallback:', error);
      return INSUMOS_MOCK_INICIAL;
    }
  },

  async obterFichasTecnicas(): Promise<FichaTecnicaItem[]> {
    try {
      const response = await apiClient.get<Array<{
        id: string;
        nome: string;
        categoria: string;
        imagemUrl?: string;
        ingredientes: Array<{ insumoId: string; nome: string; quantidade: string }>;
        custoInsumos: number;
        precoBalcao: number;
        margemBrutaPercentual: number;
        capacidadeTurnoPorcoes: number;
      }>>('/estoque/fichas-tecnicas');

      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data.map((f) => ({
          id: f.id,
          produtoId: f.id,
          nomeProduto: f.nome,
          sku: `#BOM-${f.id.substring(0, 4).toUpperCase()}`,
          versaoBom: 'v1.0 (Ativa)',
          tempoPreparoMin: 12,
          imagemUrl: f.imagemUrl,
          ingredientes: f.ingredientes.map((i) => ({
            insumoId: i.insumoId,
            nome: i.nome,
            quantidade: i.quantidade,
          })),
          custoInsumos: Number(f.custoInsumos),
          precoBalcao: Number(f.precoBalcao),
          margemBrutaPercentual: Number(f.margemBrutaPercentual),
          capacidadeTurnoPorcoes: f.capacidadeTurnoPorcoes,
        }));
      }

      return FICHAS_TECNICAS_MOCK_INICIAL;
    } catch (error) {
      console.warn('Falha ao obter fichas técnicas da API. Utilizando dados locais de fallback:', error);
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
    const origemMap: Record<string, number> = {
      Avaria: 3, // OrigemMovimentacao.Descarte
      Validade: 3, // OrigemMovimentacao.Descarte
      Inventario: 2, // OrigemMovimentacao.Inventario
    };

    const response = await apiClient.post<{ status: string }>('/estoque/baixa', {
      itens: [{ insumoId: dados.insumoId, quantidade: dados.quantidade }],
      origem: origemMap[dados.motivo] ?? 3,
      observacao: `[${dados.motivo}] ${dados.observacao || 'Baixa manual registrada pelo gestor'}`.trim(),
    });
    return response.data;
  },
};

