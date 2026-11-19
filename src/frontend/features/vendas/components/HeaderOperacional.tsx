import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { ChefHat, ReceiptText, ArrowLeft } from 'lucide-react-native';

interface HeaderOperacionalProps {
  terminal?: string;
  comanda?: string;
  statusCaixa?: 'Aberto' | 'Fechado';
  isOffline?: boolean;
  onPressVoltar?: () => void;
  onPressPerfil?: () => void;
  onPressNovoProduto?: () => void;
  onPressHistorico?: () => void;
  onPressKds?: () => void;
}

export function HeaderOperacional({
  terminal = 'PDV 01',
  comanda = '#042',
  statusCaixa = 'Aberto',
  isOffline = false,
  onPressVoltar,
  onPressPerfil,
  onPressHistorico,
  onPressKds,
}: HeaderOperacionalProps) {
  const isAberto = statusCaixa === 'Aberto' && !isOffline;

  const statusLabel = isOffline ? 'Sem Conexão' : isAberto ? 'Aberto' : 'Fechado';
  const statusTextColor = isOffline
    ? '#B45309'
    : isAberto
    ? tokens.colors.status.greenText
    : tokens.colors.status.redText;

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
            <ArrowLeft size={16} color={tokens.colors.primary} />
          </Pressable>
        )}

        <View style={styles.terminalWrapper}>
          <ThemedText variant="subtitle" weight="bold" numberOfLines={1} style={styles.terminalText}>
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

      {/* Lado Direito: Histórico + Status Caixa + Avatar Operador */}
      <View style={styles.rightRow}>
        {onPressKds && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir Painel da Cozinha KDS"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => [styles.btnHistoricoHeader, pressed && styles.pressed]}
            onPress={onPressKds}
          >
            <ChefHat size={16} color={tokens.colors.textSecondary} />
          </Pressable>
        )}

        {onPressHistorico && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Histórico de Vendas"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => [styles.btnHistoricoHeader, pressed && styles.pressed]}
            onPress={onPressHistorico}
          >
            <ReceiptText size={16} color={tokens.colors.textSecondary} />
          </Pressable>
        )}

        <View
          style={[
            styles.statusBadge,
            isOffline
              ? styles.statusBadgeOffline
              : isAberto
              ? styles.statusBadgeAberto
              : styles.statusBadgeFechado,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              isOffline
                ? styles.statusDotOffline
                : isAberto
                ? styles.statusDotAberto
                : styles.statusDotFechado,
            ]}
          />
          <ThemedText
            variant="caption"
            weight="semibold"
            color={statusTextColor}
            style={styles.statusTexto}
          >
            {statusLabel}
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
    gap: 6,
    flex: 1,
    minWidth: 0,
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
    flexShrink: 0,
  },
  terminalWrapper: {
    paddingRight: 2,
    flexShrink: 1,
  },
  terminalText: {
    fontSize: 14,
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
    flexShrink: 0,
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
    gap: 6,
    flexShrink: 0,
  },
  btnHistoricoHeader: {
    width: 30,
    height: 30,
    borderRadius: tokens.radii.sm,
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconeHistorico: {
    fontSize: 14,
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
  statusBadgeOffline: {
    backgroundColor: '#FEF3C7',
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
  statusDotOffline: {
    backgroundColor: '#D97706',
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
