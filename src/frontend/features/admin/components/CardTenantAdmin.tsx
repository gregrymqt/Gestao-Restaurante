import React from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { TenantAdminItem } from '../types';

interface CardTenantAdminProps {
  tenant: TenantAdminItem;
  isProcessando: boolean;
  onEstenderTrial: (id: string, dias: number) => void;
  onAlterarStatus: (id: string, status: string) => void;
}

export function CardTenantAdmin({
  tenant,
  isProcessando,
  onEstenderTrial,
  onAlterarStatus,
}: CardTenantAdminProps) {
  const isTrial = tenant.statusAssinatura === 'TRIAL';
  const isAtiva = tenant.statusAssinatura === 'ATIVA';
  const isExpirada = tenant.statusAssinatura === 'EXPIRADA';

  return (
    <View style={styles.card}>
      {/* Topo com Nome e Status Badge */}
      <View style={styles.header}>
        <View style={styles.infoEmpresa}>
          <ThemedText variant="subtitle" weight="bold" numberOfLines={1}>
            🏪 {tenant.nomeRestaurante}
          </ThemedText>
          <ThemedText variant="caption" style={styles.cnpjTexto}>
            CNPJ: {tenant.cnpj} • {tenant.cidade}/{tenant.estado}
          </ThemedText>
        </View>

        <View
          style={[
            styles.badgeStatus,
            isAtiva && styles.badgeAtiva,
            isTrial && styles.badgeTrial,
            isExpirada && styles.badgeExpirada,
          ]}
        >
          <ThemedText
            variant="caption"
            weight="bold"
            color={
              isAtiva
                ? tokens.colors.status.greenText
                : isTrial
                ? '#B25E00'
                : tokens.colors.status.redText
            }
          >
            {isTrial ? `TRIAL (${tenant.diasRestantesTrial}d)` : tenant.statusAssinatura}
          </ThemedText>
        </View>
      </View>

      {/* Dados do Gestor e Plano */}
      <View style={styles.detalhesBox}>
        <View style={styles.detalheLinha}>
          <ThemedText variant="caption" style={styles.label}>
            Gestor:
          </ThemedText>
          <ThemedText variant="caption" weight="bold">
            {tenant.gestorNome} ({tenant.gestorEmail})
          </ThemedText>
        </View>

        <View style={styles.detalheLinha}>
          <ThemedText variant="caption" style={styles.label}>
            Plano Vigente:
          </ThemedText>
          <ThemedText variant="caption" weight="bold" color={tokens.colors.primary}>
            {tenant.planoNome} {tenant.precoMensal > 0 ? `(R$ ${tenant.precoMensal.toFixed(2).replace('.', ',')}/mês)` : ''}
          </ThemedText>
        </View>
      </View>

      {/* Ações Administrativas de 1 Toque */}
      <View style={styles.acoesContainer}>
        <ThemedText variant="caption" weight="bold" style={styles.tituloAcoes}>
          AÇÕES RÁPIDAS SUPERADMIN:
        </ThemedText>

        <View style={styles.botoesRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Adicionar 14 dias de degustação"
            disabled={isProcessando}
            onPress={() => onEstenderTrial(tenant.restauranteId, 14)}
            style={({ pressed }) => [styles.botaoAcao, styles.botaoTrial, pressed && styles.pressed]}
          >
            <ThemedText variant="caption" weight="bold" color="#B25E00">
              +14d Trial
            </ThemedText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ativar plano pro com IA"
            disabled={isProcessando}
            onPress={() => onAlterarStatus(tenant.restauranteId, 'ATIVA')}
            style={({ pressed }) => [styles.botaoAcao, styles.botaoAtivar, pressed && styles.pressed]}
          >
            <ThemedText variant="caption" weight="bold" color={tokens.colors.status.greenText}>
              ✓ Ativar Pro
            </ThemedText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Suspender ou expirar inquilino"
            disabled={isProcessando}
            onPress={() => onAlterarStatus(tenant.restauranteId, 'EXPIRADA')}
            style={({ pressed }) => [styles.botaoAcao, styles.botaoExpirar, pressed && styles.pressed]}
          >
            <ThemedText variant="caption" weight="bold" color={tokens.colors.status.redText}>
              ✕ Suspender
            </ThemedText>
          </Pressable>
        </View>

        {isProcessando && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={tokens.colors.primary} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.sm,
  },
  infoEmpresa: {
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  cnpjTexto: {
    color: tokens.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  badgeStatus: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: tokens.radii.full,
    borderWidth: 1,
  },
  badgeAtiva: {
    backgroundColor: tokens.colors.status.greenBg,
    borderColor: '#C8E6C9',
  },
  badgeTrial: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE082',
  },
  badgeExpirada: {
    backgroundColor: tokens.colors.status.redBg,
    borderColor: '#FFCDD2',
  },
  detalhesBox: {
    backgroundColor: tokens.colors.background,
    borderRadius: tokens.radii.sm,
    padding: tokens.spacing.sm,
    gap: 4,
    marginBottom: tokens.spacing.sm,
  },
  detalheLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    color: tokens.colors.textMuted,
    fontSize: 10,
  },
  acoesContainer: {
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
    paddingTop: tokens.spacing.xs,
  },
  tituloAcoes: {
    fontSize: 9,
    color: tokens.colors.textMuted,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  botoesRow: {
    flexDirection: 'row',
    gap: tokens.spacing.xs,
  },
  botaoAcao: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: tokens.radii.sm,
    alignItems: 'center',
    borderWidth: 1,
  },
  botaoTrial: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE082',
  },
  botaoAtivar: {
    backgroundColor: tokens.colors.status.greenBg,
    borderColor: '#C8E6C9',
  },
  botaoExpirar: {
    backgroundColor: tokens.colors.status.redBg,
    borderColor: '#FFCDD2',
  },
  pressed: {
    opacity: 0.7,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radii.md,
  },
});
