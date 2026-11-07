import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';

interface HeaderOperacionalProps {
  terminal?: string;
  comanda?: string;
  statusCaixa?: 'Aberto' | 'Fechado';
  onPressVoltar?: () => void;
  onPressPerfil?: () => void;
  onPressNovoProduto?: () => void;
}

export function HeaderOperacional({
  terminal = 'PDV 01',
  comanda = '#042',
  statusCaixa = 'Aberto',
  onPressVoltar,
  onPressPerfil,
}: HeaderOperacionalProps) {
  const isAberto = statusCaixa === 'Aberto';

  return (
    <View style={styles.container}>
      {/* Lado Esquerdo: Ação de Voltar + Terminal + Comanda Ativa */}
      <View style={styles.leftRow}>
        {onPressVoltar && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar para o Painel"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={onPressVoltar}
            style={({ pressed }) => [styles.btnVoltar, pressed && styles.pressed]}
          >
            <ThemedText variant="caption" weight="bold" color={tokens.colors.primary}>
              ←
            </ThemedText>
          </Pressable>
        )}

        <View style={styles.terminalWrapper}>
          <ThemedText variant="subtitle" weight="bold" style={styles.terminalText}>
            {terminal}
          </ThemedText>
        </View>

        <View style={styles.comandaBadge}>
          <ThemedText variant="caption" style={styles.comandaLabel}>
            Comanda
          </ThemedText>
          <ThemedText variant="caption" weight="bold" style={styles.comandaNumero}>
            {comanda}
          </ThemedText>
        </View>
      </View>

      {/* Lado Direito: Status Caixa + Avatar Operador */}
      <View style={styles.rightRow}>
        <View
          style={[
            styles.statusBadge,
            isAberto ? styles.statusBadgeAberto : styles.statusBadgeFechado,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              isAberto ? styles.statusDotAberto : styles.statusDotFechado,
            ]}
          />
          <ThemedText
            variant="caption"
            weight="semibold"
            color={
              isAberto
                ? tokens.colors.status.greenText
                : tokens.colors.status.redText
            }
            style={styles.statusTexto}
          >
            {isAberto ? 'Aberto' : 'Fechado'}
          </ThemedText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Perfil do Operador"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
          onPress={onPressPerfil}
        >
          <ThemedText variant="caption" weight="bold" style={styles.avatarText}>
            OP
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    backgroundColor: tokens.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnVoltar: {
    width: 30,
    height: 30,
    borderRadius: tokens.radii.sm,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  terminalWrapper: {
    paddingRight: 4,
  },
  terminalText: {
    fontSize: 15,
    color: tokens.colors.textPrimary,
  },
  comandaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: tokens.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: tokens.radii.full,
  },
  comandaLabel: {
    fontSize: 10,
    color: tokens.colors.textSecondary,
  },
  comandaNumero: {
    fontSize: 12,
    color: tokens.colors.primary,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: tokens.radii.full,
    gap: 5,
  },
  statusBadgeAberto: {
    backgroundColor: '#EBF9EE',
  },
  statusBadgeFechado: {
    backgroundColor: tokens.colors.status.redBg,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotAberto: {
    backgroundColor: '#146C2E',
  },
  statusDotFechado: {
    backgroundColor: tokens.colors.status.redText,
  },
  statusTexto: {
    fontSize: 11,
  },
  avatarButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FDEEE9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  avatarText: {
    fontSize: 11,
    color: tokens.colors.primary,
  },
  pressed: {
    opacity: 0.75,
  },
});
