import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { TenantSelectorModal } from '@/features/auth';
import { AdminBackofficeScreen } from '@/features/admin';
import { usePerfil } from '../hooks/usePerfil';
import { OperatorHeroCard } from '../components/OperatorHeroCard';
import { TenantBranchCard } from '../components/TenantBranchCard';
import { ShiftMetricsSection } from '../components/ShiftMetricsSection';
import { TerminalStatusCard } from '../components/TerminalStatusCard';
import { OperationalActionsSection } from '../components/OperationalActionsSection';

export function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const {
    operador,
    currentTenant,
    availableTenants,
    isSseConnected,
    metricas,
    terminalStatus,
    isTenantModalOpen,
    setIsTenantModalOpen,
    handleSelectTenant,
    handleEncerrarTurno,
    handleBloquearTela,
    handleNavegarCaixa,
  } = usePerfil();

  const [isAdminBackofficeOpen, setIsAdminBackofficeOpen] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top App Bar Customizado */}
      <View style={styles.topBar}>
        <View style={styles.brandContainer}>
          <ThemedText style={styles.brandSubtitle}>GASTROBURGER POS</ThemedText>
          <ThemedText variant="title" style={styles.brandTitle}>
            Perfil do Operador
          </ThemedText>
        </View>

        <View style={styles.topBarActions}>
          <View style={styles.wifiBox}>
            <ThemedText style={styles.wifiIcon}>📶</ThemedText>
          </View>
          <View style={styles.miniAvatar}>
            <ThemedText style={styles.miniAvatarText}>
              {operador?.iniciais || 'OH'}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Conteúdo com Rolagem Fluida */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner de Conexão em Tempo Real */}
        <View style={styles.liveBanner}>
          <View style={styles.liveLeft}>
            <View
              style={[
                styles.liveDot,
                {
                  backgroundColor: isSseConnected
                    ? tokens.colors.status.greenText
                    : tokens.colors.status.redText,
                },
              ]}
            />
            <ThemedText
              style={[
                styles.liveText,
                {
                  color: isSseConnected
                    ? tokens.colors.status.greenText
                    : tokens.colors.status.redText,
                },
              ]}
            >
              {isSseConnected ? 'Tempo Real Conectado' : 'Reconectando ao Servidor...'}
            </ThemedText>
          </View>

          <View style={styles.latencyBadge}>
            <ThemedText style={styles.boltIcon}>⚡</ThemedText>
            <ThemedText style={styles.latencyText}>18ms</ThemedText>
          </View>
        </View>

        {/* 1. Hero Card do Operador */}
        <OperatorHeroCard operador={operador} />

        {/* 2. Card da Filial Ativa (Multi-Tenant) */}
        <TenantBranchCard
          tenant={currentTenant}
          onTrocarFilial={() => setIsTenantModalOpen(true)}
        />

        {/* 3. Métricas do Turno Operacional */}
        <ShiftMetricsSection metricas={metricas} />

        {/* 4. Status do Terminal & Telemetria */}
        <TerminalStatusCard
          status={terminalStatus}
          isSseConnected={isSseConnected}
        />

        {/* 5. Ações Operacionais & Logout Seguro */}
        <OperationalActionsSection
          onNavegarCaixa={handleNavegarCaixa}
          onBloquearTela={handleBloquearTela}
          onEncerrarTurno={handleEncerrarTurno}
        />

        {/* 6. Acesso SuperAdmin Backoffice SaaS */}
        <View style={styles.superAdminContainer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir Backoffice SuperAdmin SaaS"
            onPress={() => setIsAdminBackofficeOpen(true)}
            style={({ pressed }) => [styles.botaoSuperAdmin, pressed && styles.pressedSuperAdmin]}
          >
            <ThemedText style={styles.iconeSuperAdmin}>🛡️</ThemedText>
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
      </ScrollView>

      {/* Modal de Seleção de Filiais */}
      <TenantSelectorModal
        visible={isTenantModalOpen}
        tenants={availableTenants}
        tenantAtivoId={currentTenant?.id || ''}
        onSelectTenant={handleSelectTenant}
        onClose={() => setIsTenantModalOpen(false)}
      />

      {/* Modal do Backoffice SuperAdmin */}
      <Modal
        visible={isAdminBackofficeOpen}
        animationType="slide"
        onRequestClose={() => setIsAdminBackofficeOpen(false)}
      >
        <AdminBackofficeScreen onVoltar={() => setIsAdminBackofficeOpen(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  brandContainer: {
    flex: 1,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.primary,
    letterSpacing: 1,
  },
  brandTitle: {
    fontSize: tokens.typography.fontLg,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginTop: 1,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  wifiBox: {
    width: 34,
    height: 34,
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wifiIcon: {
    fontSize: 16,
  },
  miniAvatar: {
    width: 34,
    height: 34,
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.primary,
  },
  miniAvatarText: {
    fontSize: 12,
    fontWeight: '800',
    color: tokens.colors.primaryDark,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: tokens.spacing.md,
    gap: tokens.spacing.md,
  },
  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.colors.card,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radii.md,
    borderColor: tokens.colors.border,
    borderWidth: 1,
  },
  liveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: tokens.radii.full,
  },
  liveText: {
    fontSize: tokens.typography.fontSm,
    fontWeight: '700',
  },
  latencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: tokens.colors.background,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radii.full,
  },
  boltIcon: {
    fontSize: 11,
  },
  latencyText: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.textSecondary,
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
