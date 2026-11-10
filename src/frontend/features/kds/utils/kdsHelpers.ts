import { NivelSlaKds, StatusPreparoKds } from '../types';

export interface SlaCalculadoKds {
  readonly minutos: number;
  readonly segundos: number;
  readonly formatado: string;
  readonly nivel: NivelSlaKds;
  readonly atrasado: boolean;
  readonly corFundo: string;
  readonly corTexto: string;
  readonly corBorda: string;
}

export interface EstiloModificadorKds {
  readonly bg: string;
  readonly border: string;
  readonly text: string;
  readonly icone: string;
}

export interface ProximaAcaoKds {
  readonly proximoStatus: StatusPreparoKds;
  readonly label: string;
  readonly cor: string;
}

export function calcularSlaTicket(dataHoraIso: string, agoraMs: number = Date.now()): SlaCalculadoKds {
  const inicioMs = new Date(dataHoraIso).getTime();
  const diffSec = Math.max(0, Math.floor((agoraMs - (Number.isNaN(inicioMs) ? agoraMs : inicioMs)) / 1000));
  const minutos = Math.floor(diffSec / 60);
  const segundos = diffSec % 60;
  const formatado = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

  if (minutos >= 15) {
    return {
      minutos,
      segundos,
      formatado,
      nivel: 'VERMELHO',
      atrasado: true,
      corFundo: '#FEE2E2',
      corTexto: '#B91C1C',
      corBorda: '#EF4444',
    };
  }

  if (minutos >= 10) {
    return {
      minutos,
      segundos,
      formatado,
      nivel: 'AMARELO',
      atrasado: false,
      corFundo: '#FEF3C7',
      corTexto: '#B45309',
      corBorda: '#F59E0B',
    };
  }

  return {
    minutos,
    segundos,
    formatado,
    nivel: 'VERDE',
    atrasado: false,
    corFundo: '#DCFCE7',
    corTexto: '#15803D',
    corBorda: '#22C55E',
  };
}

export function obterEstiloModificadorKds(tipoAcao: string): EstiloModificadorKds {
  const tipo = tipoAcao.trim().toLowerCase();

  if (tipo === 'remocao' || tipo === '1') {
    return {
      bg: '#FEE2E2',
      border: '#EF4444',
      text: '#991B1B',
      icone: '🟥 ',
    };
  }

  if (tipo === 'culinario' || tipo === '0') {
    return {
      bg: '#DCFCE7',
      border: '#22C55E',
      text: '#166534',
      icone: '🟩 ',
    };
  }

  if (tipo === 'adicional' || tipo === 'substituicao' || tipo === '2' || tipo === '3') {
    return {
      bg: '#DBEAFE',
      border: '#3B82F6',
      text: '#1E40AF',
      icone: '🟦 ',
    };
  }

  return {
    bg: '#F3F4F6',
    border: '#D1D5DB',
    text: '#374151',
    icone: '• ',
  };
}

export function obterProximaAcaoKds(status: StatusPreparoKds): ProximaAcaoKds | null {
  switch (status) {
    case 'RECEBIDO':
      return {
        proximoStatus: 'EM_PREPARO',
        label: '🔥 Iniciar Preparo',
        cor: '#D97706',
      };
    case 'EM_PREPARO':
      return {
        proximoStatus: 'PRONTO',
        label: '✅ Marcar Pronto',
        cor: '#16A34A',
      };
    case 'PRONTO':
      return {
        proximoStatus: 'ENTREGUE',
        label: '🛎️ Entregar Pedido',
        cor: '#2563EB',
      };
    default:
      return null;
  }
}

export function obterBadgeStatusPreparo(status?: string): { label: string; bg: string; text: string } {
  const s = (status || 'RECEBIDO').toUpperCase();
  switch (s) {
    case 'RECEBIDO':
      return { label: '⏳ Novo na Cozinha', bg: '#F3F4F6', text: '#374151' };
    case 'EM_PREPARO':
      return { label: '🔥 Em Preparo', bg: '#FEF3C7', text: '#B45309' };
    case 'PRONTO':
      return { label: '✅ Pronto p/ Entrega', bg: '#DCFCE7', text: '#15803D' };
    case 'ENTREGUE':
      return { label: '🛎️ Entregue', bg: '#DBEAFE', text: '#1E40AF' };
    case 'CANCELADO':
      return { label: '✖ Cancelado', bg: '#FEE2E2', text: '#991B1B' };
    default:
      return { label: s, bg: '#F3F4F6', text: '#374151' };
  }
}
