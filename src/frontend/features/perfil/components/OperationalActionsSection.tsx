import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

interface OperationalActionsSectionProps {
  onNavegarCaixa: () => void;
  onBloquearTela: () => void;
  onEncerrarTurno: () => void;
}

export function OperationalActionsSection({
  onNavegarCaixa,
  onBloquearTela,
  onEncerrarTurno,
}: OperationalActionsSectionProps) {
  return (
    <View style={styles.container}>
      {/* Atalhos Rápidos Operacionais de Caixa */}
      <View style={styles.quickToolsGrid}>
        <TouchableOpacity
          style={styles.toolButton}
          activeOpacity={0.8}
          onPress={onNavegarCaixa}
        >
          <ThemedText style={styles.toolIcon}>➕</ThemedText>
          <ThemedText style={styles.toolText}>Suprimento</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolButton}
          activeOpacity={0.8}
          onPress={onNavegarCaixa}
        >
          <ThemedText style={styles.toolIcon}>➖</ThemedText>
          <ThemedText style={styles.toolText}>Sangria Caixa</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Ações de Alta Prioridade e Segurança */}
      <View style={styles.actionGroup}>
        {/* Bloqueio de Tela */}
        <TouchableOpacity
          style={styles.lockButton}
          activeOpacity={0.85}
          onPress={onBloquearTela}
        >
          <ThemedText style={styles.lockIcon}>🔒</ThemedText>
          <ThemedText style={styles.lockButtonText}>
            Bloquear Tela / Trocar Operador
          </ThemedText>
        </TouchableOpacity>

        {/* Encerrar Turno & Sair (Botão Destrutivo Principal) */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.85}
          onPress={onEncerrarTurno}
        >
          <ThemedText style={styles.logoutIcon}>⏻</ThemedText>
          <ThemedText style={styles.logoutButtonText}>
            Encerrar Turno & Sair
          </ThemedText>
        </TouchableOpacity>

        {/* Nota de Segurança Fiscal e Local */}
        <View style={styles.noteRow}>
          <ThemedText style={styles.noteIcon}>🛡️</ThemedText>
          <ThemedText style={styles.noteText}>
            O encerramento sincroniza registros fiscais e finaliza a gaveta local.
          </ThemedText>
        </View>
      </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  toolIcon: {
    fontSize: 16,
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
  lockIcon: {
    fontSize: 18,
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
    shadowColor: tokens.colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  logoutIcon: {
    fontSize: 20,
    color: tokens.colors.white,
    fontWeight: '900',
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
  noteIcon: {
    fontSize: 13,
  },
  noteText: {
    fontSize: 11,
    color: tokens.colors.textMuted,
    textAlign: 'center',
  },
});
