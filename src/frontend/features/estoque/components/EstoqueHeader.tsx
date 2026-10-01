import React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

interface EstoqueHeaderProps {
  totalInsumos: number;
  totalFichas: number;
  busca: string;
  onBuscaChange: (texto: string) => void;
  onScanBarcode?: () => void;
}

export function EstoqueHeader({
  totalInsumos,
  totalFichas,
  busca,
  onBuscaChange,
  onScanBarcode,
}: EstoqueHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Top Branding & Status Row */}
      <View style={styles.topBrandingRow}>
        <View style={styles.brandGroup}>
          <View style={styles.storeLogoBox}>
            <ThemedText style={styles.storeLogoIcon}>🏪</ThemedText>
          </View>
          <View>
            <ThemedText variant="body" style={styles.brandTitle}>
              GastroPDV{' '}
              <ThemedText variant="caption" color={tokens.colors.textMuted}>
                • Estoque
              </ThemedText>
            </ThemedText>
            <View style={styles.statusLive}>
              <View style={styles.statusDotLive} />
              <ThemedText variant="caption" style={styles.statusLiveText}>
                CAIXA ABERTO
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.avatarCircle}>
          <ThemedText style={styles.avatarEmoji}>👨‍🍳</ThemedText>
        </View>
      </View>

      {/* Module Tag & Title */}
      <View style={styles.titleSection}>
        <ThemedText variant="caption" style={styles.moduleTag}>
          MÓDULO DE SUPRIMENTOS
        </ThemedText>

        <View style={styles.titleRow}>
          <ThemedText variant="title" style={styles.mainTitle}>
            Gestão de Inventário
          </ThemedText>

          <View style={styles.ledgerBadge}>
            <View style={styles.ledgerDot} />
            <ThemedText variant="caption" style={styles.ledgerText}>
              Sincronizado
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Counters Chips */}
      <View style={styles.countersRow}>
        <View style={styles.counterChip}>
          <ThemedText style={styles.chipIcon}>📋</ThemedText>
          <ThemedText variant="caption" style={styles.chipText}>
            {totalInsumos} Insumos Cadastrados
          </ThemedText>
        </View>

        <View style={styles.counterChip}>
          <ThemedText style={styles.chipIcon}>🥗</ThemedText>
          <ThemedText variant="caption" style={styles.chipText}>
            {totalFichas} Fichas (BOM)
          </ThemedText>
        </View>
      </View>

      {/* Search Input Bar with Barcode Scanner Icon */}
      <View style={styles.searchBarContainer}>
        <ThemedText style={styles.searchIcon}>🔍</ThemedText>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar insumo, SKU ou código..."
          placeholderTextColor={tokens.colors.textMuted}
          value={busca}
          onChangeText={onBuscaChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onScanBarcode}
          style={styles.scanButton}
        >
          <ThemedText style={styles.scanIcon}>📷</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
    paddingBottom: tokens.spacing.sm,
  },
  topBrandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  storeLogoBox: {
    width: 38,
    height: 38,
    borderRadius: tokens.radii.sm,
    backgroundColor: tokens.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeLogoIcon: {
    fontSize: 20,
  },
  brandTitle: {
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  statusLive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  statusDotLive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.status.greenText,
  },
  statusLiveText: {
    color: tokens.colors.status.greenText,
    fontWeight: '800',
    fontSize: tokens.typography.fontXs,
    letterSpacing: 0.3,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8EAED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: tokens.colors.card,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  titleSection: {
    marginBottom: tokens.spacing.xs,
  },
  moduleTag: {
    fontSize: tokens.typography.fontXs,
    fontWeight: '800',
    color: tokens.colors.primaryDark,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  mainTitle: {
    fontSize: tokens.typography.fontXxl,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  ledgerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.status.greenBg,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: tokens.radii.full,
    gap: 5,
  },
  ledgerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.colors.status.greenText,
  },
  ledgerText: {
    color: tokens.colors.status.greenText,
    fontWeight: '700',
    fontSize: tokens.typography.fontXs,
  },
  countersRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.xs,
    marginBottom: tokens.spacing.md,
  },
  counterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.card,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 5,
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    gap: 5,
  },
  chipIcon: {
    fontSize: 12,
  },
  chipText: {
    color: tokens.colors.textSecondary,
    fontWeight: '600',
    fontSize: tokens.typography.fontXs,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    paddingHorizontal: tokens.spacing.sm,
    height: 48,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: tokens.spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: tokens.typography.fontSm,
    color: tokens.colors.textPrimary,
    paddingVertical: 0,
  },
  scanButton: {
    padding: tokens.spacing.xs,
    marginLeft: tokens.spacing.xs,
  },
  scanIcon: {
    fontSize: 18,
  },
});
