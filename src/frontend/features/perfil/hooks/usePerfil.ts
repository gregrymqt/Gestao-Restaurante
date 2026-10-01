import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore, RestauranteTenant, TENANTS_PADRAO } from '@/features/auth';
import { useSseStatus } from '@/shared/hooks/useSseStatus';
import { AppDialog } from '@/shared/components/AppDialog';
import { SessaoCaixaResumo } from '@/features/caixa/types';
import { perfilService } from '../services/perfilService';
import { ShiftMetrics, TerminalStatus, TipoMovimentacaoCaixa } from '../types';

export function usePerfil() {
  const router = useRouter();
  const operador = useAuthStore((state) => state.operador);
  const currentTenant = useAuthStore((state) => state.tenant);
  const setTenant = useAuthStore((state) => state.setTenant);
  const logout = useAuthStore((state) => state.logout);

  const sseStatus = useSseStatus((state) => state.status);
  const isSseConnected = sseStatus === 'CONNECTED';

  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [metricas, setMetricas] = useState<ShiftMetrics | null>(null);
  const [terminalStatus, setTerminalStatus] = useState<TerminalStatus | null>(null);

  // Estados dos Modais Operacionais
  const [isMovimentacaoOpen, setIsMovimentacaoOpen] = useState(false);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<TipoMovimentacaoCaixa>('SUPRIMENTO');
  const [isSubmittingMovimentacao, setIsSubmittingMovimentacao] = useState(false);

  const [isBloqueado, setIsBloqueado] = useState(false);

  const [isConfirmarFechamentoOpen, setIsConfirmarFechamentoOpen] = useState(false);
  const [isFechandoCaixa, setIsFechandoCaixa] = useState(false);

  const availableTenants: RestauranteTenant[] =
    operador?.restaurantesVinculados && operador.restaurantesVinculados.length > 0
      ? operador.restaurantesVinculados
      : TENANTS_PADRAO;

  useEffect(() => {
    perfilService.obterMetricasTurno().then(setMetricas);
    perfilService.obterStatusTerminal(isSseConnected).then(setTerminalStatus);
  }, [isSseConnected]);

  // Ações de Suprimento & Sangria em 2 toques
  const handleAbrirSuprimento = () => {
    setTipoMovimentacao('SUPRIMENTO');
    setIsMovimentacaoOpen(true);
  };

  const handleAbrirSangria = () => {
    setTipoMovimentacao('SANGRIA');
    setIsMovimentacaoOpen(true);
  };

  const handleFecharMovimentacao = () => {
    setIsMovimentacaoOpen(false);
  };

  const handleSubmitMovimentacao = async (dados: { valor: number; motivo: string }) => {
    try {
      setIsSubmittingMovimentacao(true);
      const saldoAtual = metricas?.tenderBreakdown?.dinheiro || 0;
      const res = await perfilService.registrarMovimentacao(
        { tipo: tipoMovimentacao, valor: dados.valor, motivo: dados.motivo },
        saldoAtual
      );

      // Atualiza o saldo local na memória atômica
      setMetricas((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tenderBreakdown: {
            ...prev.tenderBreakdown,
            dinheiro: res.novoSaldoDinheiro,
          },
        };
      });

      setIsMovimentacaoOpen(false);
      AppDialog.success(
        tipoMovimentacao === 'SUPRIMENTO' ? 'Suprimento Registrado' : 'Sangria Realizada',
        res.mensagem
      );
    } catch {
      AppDialog.error('Erro na Operação', 'Não foi possível registrar o lançamento de caixa.');
    } finally {
      setIsSubmittingMovimentacao(false);
    }
  };

  // Bloqueio de Terminal (Manter Caixa Aberto)
  const handleBloquearTerminal = () => {
    setIsBloqueado(true);
  };

  const handleDesbloquearTerminal = () => {
    setIsBloqueado(false);
  };

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  // Fechamento de Caixa com Conferência de Gaveta
  const handleAbrirFechamentoTurno = () => {
    setIsConfirmarFechamentoOpen(true);
  };

  const handleFecharFechamentoTurno = () => {
    setIsConfirmarFechamentoOpen(false);
  };

  const handleConfirmarFechamentoTurno = async () => {
    try {
      setIsFechandoCaixa(true);
      // Simula sincronização final de lote fiscal e fechamento da gaveta
      await new Promise((r) => setTimeout(r, 600));
      setIsConfirmarFechamentoOpen(false);
      logout();
      router.replace('/(auth)/login');
    } finally {
      setIsFechandoCaixa(false);
    }
  };

  const handleSelectTenant = (tenant: RestauranteTenant) => {
    setTenant(tenant);
    setIsTenantModalOpen(false);
  };

  // Monta objeto consolidado para o ModalConfirmarFechamento existente
  const sessaoFechamento: SessaoCaixaResumo = useMemo(
    () => ({
      id: 'sessao-atual',
      status: 'Aberta',
      terminal: 'Terminal 01',
      dataHoraFormatada: `${metricas?.inicioTurno || '08:30'} - Hoje`,
      turno: metricas?.turnoNumero ? `Turno ${metricas.turnoNumero}` : 'Turno Operacional',
      operador: operador?.nome || 'Operador Homologação',
      totalApurado: metricas?.volumeTotal || 1280.0,
      percentualMeta: metricas?.tendenciaPercentual || 18,
      totalVendas: metricas?.totalVendas || 24,
      ticketMedio: metricas?.ticketMedio || 53.35,
      pagamentos: [
        {
          id: 'pix',
          nome: 'PIX',
          tipo: 'PIX',
          valor: metricas?.tenderBreakdown?.pix || 720.0,
          percentual: 56,
          transacoesTexto: 'Instantâneo',
          badge: 'Instantâneo',
          corBarra: '#B3261E',
          icone: '⚡',
        },
        {
          id: 'cartao',
          nome: 'Cartão Crédito/Débito',
          tipo: 'Credito',
          valor: metricas?.tenderBreakdown?.cartao || 440.5,
          percentual: 34,
          transacoesTexto: 'Maquininha Integrada',
          corBarra: '#D9381E',
          icone: '💳',
        },
        {
          id: 'dinheiro',
          nome: 'Dinheiro em Espécie',
          tipo: 'Dinheiro',
          valor: metricas?.tenderBreakdown?.dinheiro || 120.0,
          percentual: 10,
          transacoesTexto: 'Cédulas na Gaveta',
          badge: 'Gaveta OK',
          corBarra: '#FCE8E6',
          icone: '💵',
        },
      ],
      clima: {
        temperatura: 24,
        condicao: 'Estável',
        umidade: 60,
        statusUmidade: 'Ideal',
        chuvaMm: 0,
        statusChuva: 'Sem Impacto',
      },
    }),
    [metricas, operador]
  );

  return {
    operador,
    currentTenant,
    availableTenants,
    isSseConnected,
    metricas,
    terminalStatus,
    isTenantModalOpen,
    setIsTenantModalOpen,
    handleSelectTenant,
    // Suprimento & Sangria
    isMovimentacaoOpen,
    tipoMovimentacao,
    isSubmittingMovimentacao,
    saldoDinheiroGaveta: metricas?.tenderBreakdown?.dinheiro || 0,
    handleAbrirSuprimento,
    handleAbrirSangria,
    handleFecharMovimentacao,
    handleSubmitMovimentacao,
    // Bloqueio
    isBloqueado,
    handleBloquearTerminal,
    handleDesbloquearTerminal,
    handleLogout,
    // Fechamento de Caixa
    isConfirmarFechamentoOpen,
    isFechandoCaixa,
    sessaoFechamento,
    handleAbrirFechamentoTurno,
    handleFecharFechamentoTurno,
    handleConfirmarFechamentoTurno,
  };
}
