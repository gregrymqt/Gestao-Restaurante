import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Package, ClipboardList, UtensilsCrossed } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { createShadow } from '@/shared/utils/shadows';
import { AbaEstoqueAtiva } from '../types';

interface SegmentedEstoqueControlProps {
  abaAtiva: AbaEstoqueAtiva;
  onSelectAba: (aba: AbaEstoqueAtiva) => void;
  badgeOrdensPendentes?: number;
}

export function SegmentedEstoqueControl({
  abaAtiva,
  onSelectAba,
  badgeOrdensPendentes,
}: SegmentedEstoqueControlProps) {
  const isInsumos = abaAtiva === 'insumos';
  const isOrdens = abaAtiva === 'ordens';
  const isFichas = abaAtiva === 'fichas';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSelectAba('insumos')}
        style={[styles.tabButton, isInsumos && styles.tabButtonActive]}
        accessibilityRole="tab"
        accessibilityState={{ selected: isInsumos }}
        accessibilityLabel="Aba Insumos e Saldos"
      >
        <Package
          size={16}
          color={isInsumos ? tokens.colors.white : tokens.colors.textSecondary}
          style={styles.tabIcon}
        />
        <ThemedText
          variant="body"
          style={[styles.tabText, isInsumos && styles.tabTextActive]}
        >
          Insumos
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSelectAba('ordens')}
        style={[styles.tabButton, isOrdens && styles.tabButtonActive]}
        accessibilityRole="tab"
        accessibilityState={{ selected: isOrdens }}
        accessibilityLabel="Aba Ordens de Compra"
      >
        <ClipboardList
          size={16}
          color={isOrdens ? tokens.colors.white : tokens.colors.textSecondary}
          style={styles.tabIcon}
        />
        <ThemedText
          variant="body"
          style={[styles.tabText, isOrdens && styles.tabTextActive]}
        >
          Ordens
        </ThemedText>
        {typeof badgeOrdensPendentes === 'number' && badgeOrdensPendentes > 0 ? (
          <View style={[styles.badge, isOrdens && styles.badgeActive]}>
            <ThemedText variant="caption" style={[styles.badgeText, isOrdens && styles.badgeTextActive]}>
              {badgeOrdensPendentes > 9 ? '9+' : badgeOrdensPendentes}
            </ThemedText>
          </View>
        ) : null}
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSelectAba('fichas')}
        style={[styles.tabButton, isFichas && styles.tabButtonActive]}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFichas }}
        accessibilityLabel="Aba Fichas Técnicas"
      >
        <UtensilsCrossed
          size={16}
          color={isFichas ? tokens.colors.white : tokens.colors.textSecondary}
          style={styles.tabIcon}
        />
        <ThemedText
          variant="body"
          style={[styles.tabText, isFichas && styles.tabTextActive]}
        >
          Fichas
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F1F3F4',
    borderRadius: tokens.radii.md,
    padding: 4,
    marginHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    minHeight: 44,
    borderRadius: tokens.radii.sm,
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: tokens.colors.primary,
    ...createShadow({
      color: tokens.colors.primary,
      offsetY: 2,
      radius: 4,
      opacity: 0.15,
      elevation: 2,
    }),
  },
  tabIcon: {
    marginRight: 2,
  },
  tabText: {
    fontWeight: '700',
    fontSize: tokens.typography.fontSm,
    color: tokens.colors.textSecondary,
  },
  tabTextActive: {
    color: tokens.colors.white,
  },
  badge: {
    backgroundColor: tokens.colors.status.orangeText,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 2,
  },
  badgeActive: {
    backgroundColor: tokens.colors.white,
  },
  badgeText: {
    color: tokens.colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 12,
  },
  badgeTextActive: {
    color: tokens.colors.primary,
  },
});
