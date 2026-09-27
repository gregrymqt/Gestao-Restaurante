export interface TenantStreamEvent {
  eventType: string;
  payloadJson: string;
  timestamp: string;
  correlationId: string;
}

export type SseConnectionState = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';

export enum SseEventTypes {
  ESTOQUE_CRITICO = 'EstoqueCritico',
  ESTOQUE_ATUALIZADO = 'EstoqueAtualizado',
  PREVISAO_CONCLUIDA = 'PrevisaoDemandaConcluida',
  VENDA_REGISTRADA = 'VendaRegistrada',
  CAIXA_TURNO_FECHADO = 'CaixaTurnoFechado',
}

export interface EstoqueCriticoPayload {
  insumoId: string;
  nomeInsumo: string;
  saldoAtual: number;
  saldoMinimo: number;
  unidadeMedida: string;
}

export interface EstoqueAtualizadoPayload {
  insumoId: string;
  novoSaldo: number;
  unidadeMedida: string;
}

export interface PrevisaoConcluidaPayload {
  previsaoId: string;
  dataAlvo: string;
  horizonteDias: number;
  gargaloPrincipal: string;
  totalItensProjetados: number;
}

export interface VendaRegistradaPayload {
  vendaId: string;
  valorTotal: number;
  horario: string;
}

export interface CaixaFechadoPayload {
  fechamentoId: string;
  horarioFechamento: string;
}

export interface RealtimeToastNotice {
  id: string;
  tipo: 'critico' | 'sucesso' | 'info';
  titulo: string;
  mensagem: string;
  dataHora: string;
  icone: string;
}
