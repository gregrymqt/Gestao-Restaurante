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
  onPressNovoProduto,
}: HeaderOperacionalProps) {
  const isAberto = statusCaixa === 'Aberto';

  return (
    <View style={styles.container}>
      <View style={styles.infoCol}>
        <View style={styles.row}>
          {onPressVoltar && (
            <>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Voltar para o Painel"
                onPress={onPressVoltar}
                style={({ pressed }) => [styles.btnVoltar, pressed && styles.pressed]}
              >
                <ThemedText variant="caption" weight="bold" color={tokens.colors.primary}>
                  ← Painel
                </ThemedText>
              </Pressable>
              <View style={styles.divider} />
            </>
          )}
          <ThemedText variant="title" style={styles.terminalText}>
            {terminal}
          </ThemedText>
          <View style={styles.divider} />
          <View style={styles.comandaBadge}>
            <ThemedText variant="caption" style={styles.comandaLabel}>
              Comanda
            </ThemedText>
            <ThemedText variant="subtitle" style={styles.comandaNumero}>
              {comanda}
            </ThemedText>
          </View>
        </View>

        <View style={styles.statusRow}>
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
            >
              {isAberto ? 'Caixa Aberto' : 'Caixa Fechado'}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.rightActionsRow}>
        {onPressNovoProduto && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Novo Produto"
            style={styles.btnNovoProduto}
            onPress={onPressNovoProduto}
          >
            <ThemedText style={styles.btnNovoProdutoText}>+ Produto</ThemedText>
          </Pressable>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Perfil do Operador"
          style={styles.avatarButton}
          onPress={onPressPerfil}
        >
          <ThemedText variant="subtitle" style={styles.avatarText}>
            OP
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
    paddingBottom: tokens.spacing.sm,
    backgroundColor: tokens.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  infoCol: {
    flexDirection: 'column',
    gap: tokens.spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  terminalText: {
    fontSize: tokens.typography.fontXl,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: tokens.colors.border,
    marginHorizontal: tokens.spacing.sm,
  },
  comandaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    backgroundColor: tokens.colors.primaryLight,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radii.sm,
  },
  comandaLabel: {
    fontSize: tokens.typography.fontXs,
    color: tokens.colors.primaryDark,
    fontWeight: '500',
  },
  comandaNumero: {
    fontSize: tokens.typography.fontSm,
    color: tokens.colors.primaryDark,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radii.full,
  },
  statusBadgeAberto: {
    backgroundColor: tokens.colors.status.greenBg,
  },
  statusBadgeFechado: {
    backgroundColor: tokens.colors.status.redBg,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: tokens.radii.full,
  },
  statusDotAberto: {
    backgroundColor: tokens.colors.status.greenText,
  },
  statusDotFechado: {
    backgroundColor: tokens.colors.status.redText,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  btnNovoProduto: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  btnNovoProdutoText: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.white,
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.primaryLight,
    borderWidth: 1,
    borderColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: tokens.colors.primary,
    fontWeight: '700',
    fontSize: tokens.typography.fontMd,
  },
  btnVoltar: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  pressed: {
    opacity: 0.7,
  },
});
