import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { StatusSessaoCaixa } from '../types';

interface ContextoOperacionalHeaderProps {
  status: StatusSessaoCaixa;
  terminal: string;
  dataHora: string;
  turno: string;
  operador: string;
  onPressAvatar?: () => void;
}

export function ContextoOperacionalHeader({
  status,
  terminal,
  dataHora,
  turno,
  operador,
  onPressAvatar,
}: ContextoOperacionalHeaderProps) {
  const isAberta = status === 'Aberta';

  return (
    <View style={styles.container}>
      {/* Linha 1: Marca do Estabelecimento e Avatar */}
      <View style={styles.topRow}>
        <View style={styles.topRowLeft}>
          <View style={styles.appIconWrapper}>
            <ThemedText variant="title">🏪</ThemedText>
          </View>
          <View style={styles.marcaCol}>
            <ThemedText variant="subtitle" style={styles.marcaNome}>
              GastroPDV
            </ThemedText>
            <View style={styles.statusIndicatorRow}>
              <View
                style={[
                  styles.dotStatus,
                  isAberta ? styles.dotAberta : styles.dotFechada,
                ]}
              />
              <ThemedText
                variant="caption"
                weight="bold"
                color={
                  isAberta
                    ? tokens.colors.status.greenText
                    : tokens.colors.status.redText
                }
              >
                {isAberta ? 'CAIXA ABERTO' : 'CAIXA FECHADO'}
              </ThemedText>
            </View>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Perfil do Operador"
          style={styles.avatarButton}
          onPress={onPressAvatar}
        >
          <ThemedText variant="subtitle" style={styles.avatarText}>
            LV
          </ThemedText>
        </Pressable>
      </View>

      {/* Linha 2: Badges de Sessão, Terminal e Data/Hora */}
      <View style={styles.sessaoInfoRow}>
        <View
          style={[
            styles.badgeSessao,
            isAberta ? styles.badgeSessaoAberta : styles.badgeSessaoFechada,
          ]}
        >
          <View
            style={[
              styles.innerDot,
              isAberta ? styles.innerDotAberta : styles.innerDotFechada,
            ]}
          />
          <ThemedText
            variant="caption"
            weight="semibold"
            color={
              isAberta
                ? tokens.colors.status.greenText
                : tokens.colors.status.redText
            }
          >
            {isAberta ? 'Sessão Aberta' : 'Sessão Fechada'}
          </ThemedText>
        </View>

        <ThemedText variant="caption" style={styles.terminalText}>
          {terminal}
        </ThemedText>

        <View style={styles.dataHoraBadge}>
          <ThemedText variant="caption" style={styles.dataHoraText}>
            🕒 {dataHora}
          </ThemedText>
        </View>
      </View>

      {/* Linha 3: Título da Tela e Turno */}
      <View style={styles.tituloRow}>
        <ThemedText variant="title" style={styles.tituloPrincipal}>
          Gestão do Caixa
        </ThemedText>
        <View style={styles.badgeTurno}>
          <ThemedText variant="caption" style={styles.iconeTurno}>
            🛡️
          </ThemedText>
          <ThemedText variant="caption" weight="bold" style={styles.textoTurno}>
            {turno}
          </ThemedText>
        </View>
      </View>

      {/* Linha 4: Nome do Operador */}
      <View style={styles.operadorRow}>
        <ThemedText variant="caption" style={styles.operadorLabel}>
          Operador:{' '}
        </ThemedText>
        <ThemedText variant="caption" weight="bold" style={styles.operadorNome}>
          {operador}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.card,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
    paddingBottom: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
  },
  topRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  appIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: tokens.radii.sm,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marcaCol: {
    flexDirection: 'column',
  },
  marcaNome: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dotStatus: {
    width: 6,
    height: 6,
    borderRadius: tokens.radii.full,
  },
  dotAberta: {
    backgroundColor: tokens.colors.status.greenText,
  },
  dotFechada: {
    backgroundColor: tokens.colors.status.redText,
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
    fontSize: tokens.typography.fontSm,
  },
  sessaoInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  badgeSessao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: tokens.radii.full,
  },
  badgeSessaoAberta: {
    backgroundColor: tokens.colors.status.greenBg,
  },
  badgeSessaoFechada: {
    backgroundColor: tokens.colors.status.redBg,
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: tokens.radii.full,
  },
  innerDotAberta: {
    backgroundColor: tokens.colors.status.greenText,
  },
  innerDotFechada: {
    backgroundColor: tokens.colors.status.redText,
  },
  terminalText: {
    color: tokens.colors.textSecondary,
    fontSize: tokens.typography.fontXs,
  },
  dataHoraBadge: {
    backgroundColor: tokens.colors.background,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radii.sm,
  },
  dataHoraText: {
    color: tokens.colors.textMuted,
    fontSize: tokens.typography.fontXs,
  },
  tituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tituloPrincipal: {
    fontSize: tokens.typography.fontXxl,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  badgeTurno: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: tokens.radii.sm,
  },
  iconeTurno: {
    fontSize: 10,
  },
  textoTurno: {
    color: '#E65100',
    fontSize: tokens.typography.fontXs,
  },
  operadorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  operadorLabel: {
    color: tokens.colors.textMuted,
    fontSize: tokens.typography.fontSm,
  },
  operadorNome: {
    color: tokens.colors.textPrimary,
    fontSize: tokens.typography.fontSm,
  },
});
