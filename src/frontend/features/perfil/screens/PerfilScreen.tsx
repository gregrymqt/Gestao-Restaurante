import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wifi, WifiOff, ShieldCheck } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { InstallPwaBanner } from '@/shared/components/InstallPwaBanner';
import { TenantSelectorModal } from '@/features/auth';
import { AdminBackofficeScreen } from '@/features/admin';
import { ModalConfirmarFechamento } from '@/features/caixa/components/ModalConfirmarFechamento';
import { usePerfil } from '../hooks/usePerfil';
import { OperatorHeroCard } from '../components/OperatorHeroCard';
import { TenantBranchCard } from '../components/TenantBranchCard';
import { ShiftMetricsSection } from '../components/ShiftMetricsSection';
import { TerminalStatusCard } from '../components/TerminalStatusCard';
import {
  QuickCashActions,
  ClosingActionsSection,
} from '../components/OperationalActionsSection';
import { ModalMovimentacaoCaixa } from '../components/ModalMovimentacaoCaixa';
import { ModalBloqueioTerminal } from '../components/ModalBloqueioTerminal';
import { PerfilHeader } from '../components/PerfilHeader';
import { LiveConnectionBanner } from '../components/LiveConnectionBanner';

export function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const {
    operador,
    currentTenant,
    availableTenants,
    isSseConnected,
    isOffline,
    metricas,
    terminalStatus,
    isTenantModalOpen,
    setIsTenantModalOpen,
    handleSelectTenant,
    // Suprimento & Sangria
    isMovimentacaoOpen,
    tipoMovimentacao,
    isSubmittingMovimentacao,
    saldoDinheiroGaveta,
    handleAbrirSuprimento,
    handleAbrirSangria,
    handleFecharMovimentacao,
    handleSubmitMovimentacao,
    // Bloqueio
    isBloqueado,
    handleBloquearTerminal,
    handleDesbloquearTerminal,
    handleLogout,
    // Fechamento com Gaveta
    isConfirmarFechamentoOpen,
    isFechandoCaixa,
    sessaoFechamento,
    handleAbrirFechamentoTurno,
    handleFecharFechamentoTurno,
    handleConfirmarFechamentoTurno,
  } = usePerfil();

  const [isAdminBackofficeOpen, setIsAdminBackofficeOpen] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top App Bar Customizado */}
      <PerfilHeader iniciais={operador?.iniciais || 'OH'} />

      {/* Conteúdo com Rolagem Fluida */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner de Conexão em Tempo Real */}
        <LiveConnectionBanner isOffline={isOffline} />

        {/* 1. Hero Card do Operador */}
        <OperatorHeroCard operador={operador} />

        {/* 2. Card da Filial Ativa (Multi-Tenant) */}
        <TenantBranchCard
          tenant={currentTenant}
          onTrocarFilial={() => setIsTenantModalOpen(true)}
        />

        {/* 3. Atalhos Rápidos Operacionais do Turno (Zona do Polegar) */}
        <QuickCashActions
          onAbrirSuprimento={handleAbrirSuprimento}
          onAbrirSangria={handleAbrirSangria}
        />

        {/* 4. Métricas do Turno Operacional */}
        <ShiftMetricsSection metricas={metricas} />

        {/* 5. Status do Terminal & Telemetria */}
        <TerminalStatusCard
          status={terminalStatus}
          isSseConnected={isSseConnected}
          isOffline={isOffline}
        />

        {/* 6. Ações de Bloqueio e Encerramento de Turno */}
        <ClosingActionsSection
          onBloquearTerminal={handleBloquearTerminal}
          onEncerrarTurno={handleAbrirFechamentoTurno}
          isOffline={isOffline}
        />

        {/* Atalho de Instalação PWA quando disponível no navegador */}
        <InstallPwaBanner variant="card" />

        {/* 7. Acesso SuperAdmin Backoffice SaaS (Restrito por RBAC) */}
        {operador?.role === 'SuperAdmin' ? (
          <View style={styles.superAdminContainer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir Backoffice SuperAdmin SaaS"
              onPress={() => setIsAdminBackofficeOpen(true)}
              style={({ pressed }) => [styles.botaoSuperAdmin, pressed && styles.pressedSuperAdmin]}
            >
              <ShieldCheck size={24} color="#FFFFFF" />
              <View style={styles.textosSuperAdmin}>
                <ThemedText variant="subtitle" weight="bold" color="#FFFFFF">
                  Backoffice SuperAdmin SaaS
                </ThemedText>
                <ThemedText variant="caption" style={styles.subtextoSuperAdmin}>
                  Gestão visual de inquilinos, trials e assinaturas sem CLI
                </ThemedText>
              </View>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      {/* Modal de Seleção de Filiais */}
      <TenantSelectorModal
        visible={isTenantModalOpen}
        tenants={availableTenants}
        tenantAtivoId={currentTenant?.id || ''}
        onSelectTenant={handleSelectTenant}
        onClose={() => setIsTenantModalOpen(false)}
      />

      {/* Modal de Suprimento e Sangria em 2 toques */}
      <ModalMovimentacaoCaixa
        visible={isMovimentacaoOpen}
        tipo={tipoMovimentacao}
        saldoDisponivel={saldoDinheiroGaveta}
        isSubmitting={isSubmittingMovimentacao}
        onClose={handleFecharMovimentacao}
        onSubmit={handleSubmitMovimentacao}
      />

      {/* Overlay de Bloqueio de Terminal com PIN */}
      <ModalBloqueioTerminal
        visible={isBloqueado}
        operadorNome={operador?.nome || 'Operador Homologação'}
        operadorIniciais={operador?.iniciais || 'OH'}
        onDesbloquear={handleDesbloquearTerminal}
        onLogout={handleLogout}
      />

      {/* Modal de Conferência Física da Gaveta antes do Logout */}
      <ModalConfirmarFechamento
        visible={isConfirmarFechamentoOpen}
        sessao={sessaoFechamento}
        isPending={isFechandoCaixa}
        onConfirmar={handleConfirmarFechamentoTurno}
        onClose={handleFecharFechamentoTurno}
      />

      {/* Modal do Backoffice SuperAdmin */}
      {operador?.role === 'SuperAdmin' ? (
        <Modal
          visible={isAdminBackofficeOpen}
          animationType="slide"
          onRequestClose={() => setIsAdminBackofficeOpen(false)}
        >
          <AdminBackofficeScreen onVoltar={() => setIsAdminBackofficeOpen(false)} />
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: tokens.spacing.md,
    gap: tokens.spacing.md,
  },
  superAdminContainer: {
    paddingHorizontal: tokens.spacing.lg,
    marginTop: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
  },
  botaoSuperAdmin: {
    backgroundColor: '#1E1E2C',
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    borderWidth: 1,
    borderColor: '#3F3F5A',
  },
  pressedSuperAdmin: {
    opacity: 0.85,
  },
  iconeSuperAdmin: {
    fontSize: 26,
  },
  textosSuperAdmin: {
    flex: 1,
  },
  subtextoSuperAdmin: {
    color: '#A0A0B8',
    fontSize: 11,
    marginTop: 2,
  },
});
