import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { shadows, createShadow } from '@/shared/utils/shadows';
import { OperadorRecente } from '@/features/auth';

interface OperatorHeroCardProps {
  operador: OperadorRecente | null;
}

export function OperatorHeroCard({ operador }: OperatorHeroCardProps) {
  const nome = operador?.nome || 'Operador Homologação';
  const email = operador?.email || 'operador@restaurante.com';
  const matricula = operador?.matricula || '05829';
  const iniciais =
    operador?.iniciais ||
    nome
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        {/* Avatar Monograma com Badge de Presença */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>{iniciais}</ThemedText>
          </View>
          <View style={styles.activeCheckBadge}>
            <ThemedText style={styles.checkIcon}>✓</ThemedText>
          </View>
        </View>

        {/* Informações Cadastrais */}
        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <ThemedText variant="title" style={styles.operatorName}>
              {nome}
            </ThemedText>
            <View style={styles.badgeIconBox}>
              <ThemedText style={styles.badgeIcon}>🪪</ThemedText>
            </View>
          </View>

          {/* Tag de Cargo Operacional */}
          <View style={styles.roleTag}>
            <ThemedText style={styles.roleText}>
              💳 Operador de Caixa & Balcão
            </ThemedText>
          </View>

          {/* Matrícula e E-mail */}
          <View style={styles.detailsGroup}>
            <View style={styles.matriculaRow}>
              <ThemedText style={styles.matriculaLabel}>MATRÍCULA:</ThemedText>
              <View style={styles.matriculaPill}>
                <ThemedText style={styles.matriculaValue}>#{matricula}</ThemedText>
              </View>
            </View>

            <View style={styles.emailRow}>
              <ThemedText style={styles.emailIcon}>✉️</ThemedText>
              <ThemedText style={styles.emailText} numberOfLines={1}>
                {email}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* Faixa Inferior de Privilégios & Sessão */}
      <View style={styles.footerStrip}>
        <View style={styles.levelRow}>
          <ThemedText style={styles.shieldIcon}>🛡️</ThemedText>
          <ThemedText style={styles.levelText}>Nível: Balcão & Sangria</ThemedText>
        </View>
        <View style={styles.sessionActiveBadge}>
          <ThemedText style={styles.sessionActiveText}>Sessão Ativa</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.md,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    ...shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({
      color: tokens.colors.primaryDark,
      offsetY: 2,
      radius: 4,
      opacity: 0.25,
      elevation: 3,
    }),
  },
  avatarText: {
    color: tokens.colors.white,
    fontSize: tokens.typography.fontXl,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  activeCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.status.greenText,
    borderWidth: 2,
    borderColor: tokens.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: tokens.colors.white,
    fontSize: 10,
    fontWeight: '900',
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  operatorName: {
    fontSize: tokens.typography.fontLg,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    flex: 1,
  },
  badgeIconBox: {
    width: 28,
    height: 28,
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    fontSize: 14,
  },
  roleTag: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.colors.primaryLight,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radii.full,
    marginTop: tokens.spacing.xs,
  },
  roleText: {
    fontSize: tokens.typography.fontXs,
    fontWeight: '700',
    color: tokens.colors.primaryDark,
  },
  detailsGroup: {
    marginTop: tokens.spacing.sm,
    gap: 4,
  },
  matriculaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  matriculaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.textMuted,
    letterSpacing: 0.5,
  },
  matriculaPill: {
    backgroundColor: tokens.colors.background,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: tokens.radii.sm,
  },
  matriculaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emailIcon: {
    fontSize: 12,
  },
  emailText: {
    fontSize: tokens.typography.fontSm,
    color: tokens.colors.textSecondary,
    flex: 1,
  },
  footerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.colors.background,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radii.sm,
    marginTop: tokens.spacing.md,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shieldIcon: {
    fontSize: 13,
  },
  levelText: {
    fontSize: tokens.typography.fontSm,
    fontWeight: '600',
    color: tokens.colors.textPrimary,
  },
  sessionActiveBadge: {
    backgroundColor: tokens.colors.status.greenBg,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radii.full,
  },
  sessionActiveText: {
    fontSize: tokens.typography.fontXs,
    fontWeight: '700',
    color: tokens.colors.status.greenText,
  },
});
