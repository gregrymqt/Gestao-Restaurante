import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { RestauranteTenant } from '@/features/auth';

interface TenantBranchCardProps {
  tenant: RestauranteTenant | null;
  onTrocarFilial: () => void;
}

export function TenantBranchCard({
  tenant,
  onTrocarFilial,
}: TenantBranchCardProps) {
  const nome = tenant?.nome || 'Restaurante Teste E2E';
  const filial = tenant?.filialNumero || 'FILIAL #01';
  const cnpj = tenant?.cnpj || '12.345.678/0001-90';

  return (
    <View style={styles.card}>
      <View style={styles.contentLeft}>
        {/* Ícone de Unidade Operacional */}
        <View style={styles.iconBox}>
          <ThemedText style={styles.storeIcon}>🏪</ThemedText>
        </View>

        {/* Detalhes da Filial e CNPJ */}
        <View style={styles.textContainer}>
          <View style={styles.nameRow}>
            <ThemedText variant="body" style={styles.tenantName} numberOfLines={1}>
              {nome}
            </ThemedText>
            <View style={styles.filialTag}>
              <ThemedText style={styles.filialText}>{filial}</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.cnpjLabel}>
            CNPJ: {cnpj}
          </ThemedText>
        </View>
      </View>

      {/* Botão de Alternância de Filial */}
      <TouchableOpacity
        style={styles.switchButton}
        activeOpacity={0.8}
        onPress={onTrocarFilial}
      >
        <ThemedText style={styles.switchButtonText}>Trocar</ThemedText>
        <ThemedText style={styles.switchIcon}>⇄</ThemedText>
      </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: tokens.radii.md,
    backgroundColor: tokens.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeIcon: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  tenantName: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    flexShrink: 1,
  },
  filialTag: {
    backgroundColor: tokens.colors.background,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: tokens.radii.sm,
  },
  filialText: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.textSecondary,
  },
  cnpjLabel: {
    fontSize: tokens.typography.fontXs,
    color: tokens.colors.textMuted,
    marginTop: 2,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: tokens.colors.background,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  switchButtonText: {
    fontSize: tokens.typography.fontSm,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  switchIcon: {
    fontSize: 14,
    color: tokens.colors.textSecondary,
  },
});
