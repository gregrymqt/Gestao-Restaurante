import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus, Minus, Lock, Power, ShieldAlert } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { shadows, createShadow } from '@/shared/utils/shadows';

export interface QuickCashActionsProps {
  onAbrirSuprimento: () => void;
  onAbrirSangria: () => void;
}

export function QuickCashActions({
  onAbrirSuprimento,
  onAbrirSangria,
}: QuickCashActionsProps) {
  return (
    <View style={styles.quickToolsGrid}>
      <TouchableOpacity
        style={styles.toolButton}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Suprimento - Entrada no Caixa"
        onPress={onAbrirSuprimento}
      >
        <Plus size={16} color={tokens.colors.status.greenText} />
        <ThemedText style={styles.toolText}>Suprimento</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.toolButton}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Sangria Caixa - Retirada"
        onPress={onAbrirSangria}
      >
        <Minus size={16} color={tokens.colors.status.redText} />
        <ThemedText style={styles.toolText}>Sangria Caixa</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

export interface ClosingActionsSectionProps {
  onBloquearTerminal: () => void;
  onEncerrarTurno: () => void;
  isOffline?: boolean;
}

export function ClosingActionsSection({
  onBloquearTerminal,
  onEncerrarTurno,
  isOffline = false,
}: ClosingActionsSectionProps) {
  return (
    <View style={styles.actionGroup}>
      {/* Bloqueio de Terminal */}
      <TouchableOpacity
        style={styles.lockButton}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Bloquear terminal mantendo caixa aberto"
        onPress={onBloquearTerminal}
      >
        <Lock size={16} color={tokens.colors.textPrimary} />
        <ThemedText style={styles.lockButtonText}>
          Bloquear Terminal (Manter Caixa Aberto)
        </ThemedText>
      </TouchableOpacity>

      {/* Fechar Caixa & Encerrar Turno */}
      <TouchableOpacity
        style={[
          styles.logoutButton,
          isOffline && styles.logoutButtonDisabled,
        ]}
        activeOpacity={isOffline ? 1 : 0.85}
        accessibilityRole="button"
        accessibilityLabel={isOffline ? 'Conexão necessária para encerrar' : 'Fechar caixa e encerrar turno'}
        accessibilityState={{ disabled: isOffline }}
        disabled={isOffline}
        onPress={isOffline ? undefined : onEncerrarTurno}
      >
        <Power size={18} color={tokens.colors.white} />
        <ThemedText style={styles.logoutButtonText}>
          {isOffline ? 'Conexão necessária para encerrar' : 'Fechar Caixa & Encerrar Turno'}
        </ThemedText>
      </TouchableOpacity>

      {/* Nota de Segurança Fiscal e Local */}
      <View style={styles.noteRow}>
        <ShieldAlert size={14} color={tokens.colors.textMuted} />
        <ThemedText style={styles.noteText}>
          O encerramento confere a gaveta física e consolida as vendas do turno.
        </ThemedText>
      </View>
    </View>
  );
}

interface OperationalActionsSectionProps {
  onAbrirSuprimento: () => void;
  onAbrirSangria: () => void;
  onBloquearTerminal: () => void;
  onEncerrarTurno: () => void;
  isOffline?: boolean;
}

export function OperationalActionsSection({
  onAbrirSuprimento,
  onAbrirSangria,
  onBloquearTerminal,
  onEncerrarTurno,
  isOffline = false,
}: OperationalActionsSectionProps) {
  return (
    <View style={styles.container}>
      <QuickCashActions
        onAbrirSuprimento={onAbrirSuprimento}
        onAbrirSangria={onAbrirSangria}
      />
      <ClosingActionsSection
        onBloquearTerminal={onBloquearTerminal}
        onEncerrarTurno={onEncerrarTurno}
        isOffline={isOffline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing.md,
  },
  quickToolsGrid: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  toolButton: {
    flex: 1,
    minHeight: 48,
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.xs,
    ...shadows.sm,
  },
  toolText: {
    fontSize: tokens.typography.fontSm,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  actionGroup: {
    gap: tokens.spacing.sm,
  },
  lockButton: {
    minHeight: 52,
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
    borderColor: tokens.colors.border,
    borderWidth: 1,
  },
  lockButtonText: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  logoutButton: {
    minHeight: 54,
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
    ...createShadow({
      color: tokens.colors.primaryDark,
      offsetY: 3,
      radius: 5,
      opacity: 0.25,
      elevation: 3,
    }),
  },
  logoutButtonDisabled: {
    backgroundColor: tokens.colors.textMuted,
    opacity: 0.6,
    elevation: 0,
    shadowOpacity: 0,
  },
  logoutButtonText: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '700',
    color: tokens.colors.white,
    letterSpacing: 0.2,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: tokens.spacing.sm,
    marginTop: 2,
  },
  noteText: {
    fontSize: 11,
    color: tokens.colors.textMuted,
    textAlign: 'center',
  },
});
