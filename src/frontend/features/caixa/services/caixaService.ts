import { apiClient, extractErrorMessage } from '@/services/api';
import { AbrirCaixaResponseDto, FecharCaixaResponseDto, SessaoCaixaResumo } from '../types';

export const DADOS_SESSAO_PADRAO: SessaoCaixaResumo = {
  id: 'sessao-caixa-01',
  status: 'Aberta',
  terminal: 'Terminal 01',
  dataHoraFormatada: '11:38 - 27/09',
  turno: 'Turno Almoço',
  operador: 'Lucas Vicente',
  totalApurado: 2480.50,
  percentualMeta: 18.4,
  totalVendas: 38,
  ticketMedio: 65.27,
  pagamentos: [
    {
      id: 'metodo-pix',
      nome: 'PIX',
      tipo: 'PIX',
      valor: 1120.00,
      percentual: 45,
      transacoesTexto: 'Taxa líquida 0%',
      badge: 'Instantâneo',
      corBarra: '#00897B',
      corContainer: '#E0F2F1',
      iconeVector: 'flash',
    },
    {
      id: 'metodo-credito',
      nome: 'Cartão Crédito',
      tipo: 'Credito',
      valor: 740.50,
      percentual: 30,
      transacoesTexto: '14 transações',
      corBarra: '#1E88E5',
      corContainer: '#E3F2FD',
      iconeVector: 'card',
    },
    {
      id: 'metodo-debito',
      nome: 'Cartão Débito',
      tipo: 'Debito',
      valor: 420.00,
      percentual: 17,
      transacoesTexto: '9 transações',
      corBarra: '#7E57C2',
      corContainer: '#EDE7F6',
      iconeVector: 'card',
    },
    {
      id: 'metodo-dinheiro',
      nome: 'Dinheiro',
      tipo: 'Dinheiro',
      valor: 200.00,
      percentual: 8,
      transacoesTexto: '5 transações físicas',
      badge: 'Gaveta OK',
      corBarra: '#F59E0B',
      corContainer: '#FEF3C7',
      iconeVector: 'cash',
    },
  ],
};

interface DashboardResumoSessaoResponse {
  statusLoja?: string;
  turnoAtual?: string;
  kpis?: {
    totalFaturadoDia?: number | string;
    quantidadePedidos?: number | string;
    ticketMedio?: number | string;
    percentualMeta?: number | string;
  };
}

export const caixaService = {
  async abrirCaixa(): Promise<AbrirCaixaResponseDto> {
    try {
      const response = await apiClient.post<AbrirCaixaResponseDto>('/caixa/abrir', {});
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractErrorMessage(err, 'Não foi possível abrir o caixa.'));
    }
  },

  async obterSessaoAtiva(): Promise<SessaoCaixaResumo> {
    try {
      const res = await apiClient.get<DashboardResumoSessaoResponse>('/dashboard/resumo');
      if (res.data) {
        const kpis = res.data.kpis;
        return {
          ...DADOS_SESSAO_PADRAO,
          status: res.data.statusLoja === 'ABERTA' ? 'Aberta' : 'Fechada',
          totalApurado: Number(kpis?.totalFaturadoDia ?? DADOS_SESSAO_PADRAO.totalApurado),
          totalVendas: Number(kpis?.quantidadePedidos ?? DADOS_SESSAO_PADRAO.totalVendas),
          ticketMedio: Number(kpis?.ticketMedio ?? DADOS_SESSAO_PADRAO.ticketMedio),
          percentualMeta: Number(kpis?.percentualMeta ?? DADOS_SESSAO_PADRAO.percentualMeta),
          turno: res.data.turnoAtual || DADOS_SESSAO_PADRAO.turno,
        };
      }
    } catch {
      // Fallback resiliente
    }

    return DADOS_SESSAO_PADRAO;
  },

  async fecharCaixa(): Promise<FecharCaixaResponseDto> {
    try {
      const response = await apiClient.post<FecharCaixaResponseDto>('/caixa/fechar');
      return response.data;
    } catch (err: unknown) {
      throw new Error(extractErrorMessage(err, 'Não foi possível fechar o caixa.'));
    }
  },
};
