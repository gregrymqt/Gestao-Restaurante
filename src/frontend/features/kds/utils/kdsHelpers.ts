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

export type TipoIconeModificador = 'X' | 'Flame' | 'Plus' | 'Dot';

export interface EstiloModificadorKds {
  readonly bg: string;
  readonly border: string;
  readonly text: string;
  readonly icone: TipoIconeModificador;
}

export interface ProximaAcaoKds {
  readonly proximoStatus: StatusPreparoKds;
  readonly label: string;
  readonly cor: string;
}

export interface CoresHeaderKds {
  readonly corFundo: string;
  readonly corBorda: string;
  readonly corTexto: string;
}

export function sanitizarNomeModificador(nome: string): string {
  return nome.replace(/^[+\-•\s]+/, '').trim();
}

export function obterCoresHeaderKds(status: StatusPreparoKds, sla: SlaCalculadoKds): CoresHeaderKds {
  // 1. Pronto (concluído): Verde exclusivo (#DCFCE7 / #22C55E / #15803D)
  if (status === 'PRONTO') {
    return { corFundo: '#DCFCE7', corBorda: '#22C55E', corTexto: '#15803D' };
  }

  // 2. Atrasado (não concluído): Alerta vermelho
  if (sla.atrasado) {
    return { corFundo: '#FEE2E2', corBorda: '#EF4444', corTexto: '#B91C1C' };
  }

  // 3. Novo na cozinha (RECEBIDO): Âmbar / Laranja de Ação Pendente
  if (status === 'RECEBIDO') {
    return { corFundo: '#FFFBEB', corBorda: '#F59E0B', corTexto: '#B45309' };
  }

  // 4. Em preparo amarelo
  if (sla.nivel === 'AMARELO') {
    return { corFundo: '#FEF3C7', corBorda: '#F59E0B', corTexto: '#B45309' };
  }

  // 5. Em preparo no prazo inicial: Slate neutro (reserva verde exclusivamente para concluídos)
  return { corFundo: '#F8FAFC', corBorda: '#CBD5E1', corTexto: '#334155' };
}

export function formatarTempoSla(minutos: number, segundos: number): string {
  if (minutos >= 60) {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${String(mins).padStart(2, '0')}m`;
  }
  return `${String(minutos).padStart(2, '0')}m ${String(segundos).padStart(2, '0')}s`;
}

export function calcularSlaTicket(dataHoraIso: string, agoraMs: number = Date.now()): SlaCalculadoKds {
  const inicioMs = new Date(dataHoraIso).getTime();
  const diffSec = Math.max(0, Math.floor((agoraMs - (Number.isNaN(inicioMs) ? agoraMs : inicioMs)) / 1000));
  const minutos = Math.floor(diffSec / 60);
  const segundos = diffSec % 60;
  const formatado = formatarTempoSla(minutos, segundos);

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
      icone: 'X',
    };
  }

  if (tipo === 'culinario' || tipo === '0') {
    return {
      bg: '#DCFCE7',
      border: '#22C55E',
      text: '#166534',
      icone: 'Flame',
    };
  }

  if (tipo === 'adicional' || tipo === 'substituicao' || tipo === '2' || tipo === '3') {
    return {
      bg: '#DBEAFE',
      border: '#3B82F6',
      text: '#1E40AF',
      icone: 'Plus',
    };
  }

  return {
    bg: '#F3F4F6',
    border: '#D1D5DB',
    text: '#374151',
    icone: 'Dot',
  };
}

export function obterProximaAcaoKds(status: StatusPreparoKds): ProximaAcaoKds | null {
  switch (status) {
    case 'RECEBIDO':
      return {
        proximoStatus: 'EM_PREPARO',
        label: 'Iniciar Preparo',
        cor: '#D97706',
      };
    case 'EM_PREPARO':
      return {
        proximoStatus: 'PRONTO',
        label: 'Marcar Pronto',
        cor: '#16A34A',
      };
    case 'PRONTO':
      return {
        proximoStatus: 'ENTREGUE',
        label: 'Entregar Pedido',
        cor: '#16A34A',
      };
    default:
      return null;
  }
}

export function obterBadgeStatusPreparo(status?: string): { label: string; bg: string; text: string } {
  const s = (status || 'RECEBIDO').toUpperCase();
  switch (s) {
    case 'RECEBIDO':
      return { label: 'Novo na Cozinha', bg: '#F3F4F6', text: '#374151' };
    case 'EM_PREPARO':
      return { label: 'Em Preparo', bg: '#FEF3C7', text: '#B45309' };
    case 'PRONTO':
      return { label: 'Pronto p/ Entrega', bg: '#DCFCE7', text: '#15803D' };
    case 'ENTREGUE':
      return { label: 'Entregue', bg: '#DBEAFE', text: '#1E40AF' };
    case 'CANCELADO':
      return { label: 'Cancelado', bg: '#FEE2E2', text: '#991B1B' };
    default:
      return { label: s, bg: '#F3F4F6', text: '#374151' };
  }
}
