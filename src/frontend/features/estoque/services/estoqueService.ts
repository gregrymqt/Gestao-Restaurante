import { apiClient } from '@/services/api';
import {
  InsumoEstoque,
  FichaTecnicaItem,
  EntradaEstoqueInput,
  EntradaEstoqueResponse,
} from '../types';

export const INSUMOS_MOCK_INICIAL: InsumoEstoque[] = [
  {
    id: 'ins-08',
    nome: 'Carne Bovina Moída (Smash)',
    sku: '#INS-08',
    categoria: 'Proteínas / Carnes',
    localizacao: 'Câmara Fria 01',
    saldoAtual: 16.2,
    estoqueMinimo: 25.0,
    estoqueIdeal: 35.0,
    unidadeMedida: 'kg',
    statusNivel: 'critico',
    percentualCapacidade: 64.8,
    deficitQuantidade: 8.8,
    deficitPercentual: 35,
    custoUnitarioMedio: 38.5,
  },
  {
    id: 'ins-14',
    nome: 'Queijo Cheddar Fatiado',
    sku: '#INS-14',
    categoria: 'Laticínios',
    localizacao: 'Refrigerador 02',
    saldoAtual: 4.8,
    estoqueMinimo: 5.0,
    estoqueIdeal: 8.0,
    unidadeMedida: 'kg',
    statusNivel: 'atencao',
    percentualCapacidade: 60.0,
    leadTimeHoras: 24,
    custoUnitarioMedio: 45.0,
  },
  {
    id: 'ins-02',
    nome: 'Pão Brioche Artesanal',
    sku: '#INS-02',
    categoria: 'Panificação',
    localizacao: 'Estoque Seco',
    saldoAtual: 120,
    estoqueMinimo: 50,
    estoqueIdeal: 150,
    unidadeMedida: 'unid',
    statusNivel: 'normal',
    percentualCapacidade: 100.0,
    observacaoConsumo: 'Cobre 2.4x o consumo médio do turno da noite.',
    custoUnitarioMedio: 3.3,
  },
  {
    id: 'ins-05',
    nome: 'Bacon em Fatias Defumado',
    sku: '#INS-05',
    categoria: 'Proteínas / Embutidos',
    localizacao: 'Câmara Fria 02',
    saldoAtual: 14.5,
    estoqueMinimo: 8.0,
    estoqueIdeal: 18.0,
    unidadeMedida: 'kg',
    statusNivel: 'normal',
    percentualCapacidade: 100.0,
    custoUnitarioMedio: 42.0,
  },
];

export const FICHAS_TECNICAS_MOCK_INICIAL: FichaTecnicaItem[] = [
  {
    id: 'bom-01',
    produtoId: 'prod-smash-duplo',
    nomeProduto: 'Smash Burger Duplo',
    sku: '#PDV-01',
    versaoBom: 'v3.2',
    tempoPreparoMin: 4,
    imagemUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    ingredientes: [
      { insumoId: 'ins-08', nome: 'Carne 90g (x2)', quantidade: '180g', isGargalo: true },
      { insumoId: 'ins-02', nome: 'Pão Brioche (x1)', quantidade: '1 un' },
      { insumoId: 'ins-14', nome: 'Cheddar (x2)', quantidade: '40g' },
      { insumoId: 'ins-05', nome: 'Bacon Crisp (x1)', quantidade: '30g' },
    ],
    custoInsumos: 11.4,
    precoBalcao: 34.98,
    margemBrutaPercentual: 67.3,
    capacidadeTurnoPorcoes: 90,
    insumoLimitanteNome: 'Carne Bovina Moída',
  },
  {
    id: 'bom-02',
    produtoId: 'prod-batata-rustica',
    nomeProduto: 'Batata Rústica Trufada',
    sku: '#PDV-02',
    versaoBom: 'v2.1',
    tempoPreparoMin: 6,
    imagemUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80',
    ingredientes: [
      { insumoId: 'ins-batata', nome: 'Batata Rústica 250g', quantidade: '250g' },
      { insumoId: 'ins-azeite', nome: 'Azeite Trufado 15ml', quantidade: '15ml', isGargalo: true },
      { insumoId: 'ins-alecrim', nome: 'Alecrim Fresco', quantidade: '2g' },
      { insumoId: 'ins-sal', nome: 'Sal de Parrilla', quantidade: '3g' },
    ],
    custoInsumos: 7.8,
    precoBalcao: 26.0,
    margemBrutaPercentual: 70.0,
    capacidadeTurnoPorcoes: 85,
    insumoLimitanteNome: 'Azeite Trufado',
  },
  {
    id: 'bom-03',
    produtoId: 'prod-suco-laranja',
    nomeProduto: 'Suco Laranja Especial 500ml',
    sku: '#PDV-03',
    versaoBom: 'v1.0',
    tempoPreparoMin: 3,
    imagemUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80',
    ingredientes: [
      { insumoId: 'ins-laranja', nome: 'Laranja Pêra Fresca', quantidade: '600g' },
      { insumoId: 'ins-gelo', nome: 'Gelo Filtrado', quantidade: '100g' },
    ],
    custoInsumos: 3.2,
    precoBalcao: 14.0,
    margemBrutaPercentual: 77.1,
    capacidadeTurnoPorcoes: 100,
  },
];

// Estado local em memória para simulação offline de entradas
let insumosEmMemoria: InsumoEstoque[] = [...INSUMOS_MOCK_INICIAL];

export const estoqueService = {
  async obterInsumos(): Promise<InsumoEstoque[]> {
    try {
      const response = await apiClient.get<InsumoEstoque[]>('/estoque/insumos');
      return response.data;
    } catch {
      // Fallback resiliente com dados do Stitch
      return [...insumosEmMemoria];
    }
  },

  async obterFichasTecnicas(): Promise<FichaTecnicaItem[]> {
    try {
      const response = await apiClient.get<FichaTecnicaItem[]>('/estoque/fichas-tecnicas');
      return response.data;
    } catch {
      return [...FICHAS_TECNICAS_MOCK_INICIAL];
    }
  },

  async registrarEntradaEstoque(entrada: EntradaEstoqueInput): Promise<EntradaEstoqueResponse> {
    try {
      const response = await apiClient.post<EntradaEstoqueResponse>('/estoque/entrada', entrada);
      return response.data;
    } catch {
      // Atualização simulada em memória
      const insumo = insumosEmMemoria.find((i) => i.id === entrada.insumoId);
      const novoSaldo = insumo ? Number((insumo.saldoAtual + entrada.quantidade).toFixed(3)) : entrada.quantidade;

      if (insumo) {
        insumosEmMemoria = insumosEmMemoria.map((item) => {
          if (item.id === entrada.insumoId) {
            const statusNivel = novoSaldo < item.estoqueMinimo ? 'critico' : novoSaldo < (item.estoqueIdeal || item.estoqueMinimo * 1.3) ? 'atencao' : 'normal';
            return {
              ...item,
              saldoAtual: novoSaldo,
              statusNivel,
              percentualCapacidade: Math.min(100, Math.round((novoSaldo / (item.estoqueIdeal || item.estoqueMinimo * 1.5)) * 100)),
              deficitQuantidade: Math.max(0, Number((item.estoqueMinimo - novoSaldo).toFixed(3))),
            };
          }
          return item;
        });
      }

      return {
        id: `mov-${Date.now().toString(36)}`,
        insumoId: entrada.insumoId,
        quantidadeAdicionada: entrada.quantidade,
        novoSaldo,
        dataHora: new Date().toISOString(),
        protocoloLedger: `LEDGER-IN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      };
    }
  },
};
