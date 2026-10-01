import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { createShadow } from '@/shared/utils/shadows';
import { AbaEstoqueAtiva } from '../types';

interface SegmentedEstoqueControlProps {
  abaAtiva: AbaEstoqueAtiva;
  onSelectAba: (aba: AbaEstoqueAtiva) => void;
}

export function SegmentedEstoqueControl({
  abaAtiva,
  onSelectAba,
}: SegmentedEstoqueControlProps) {
  const isInsumos = abaAtiva === 'insumos';
  const isFichas = abaAtiva === 'fichas';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSelectAba('insumos')}
        style={[styles.tabButton, isInsumos && styles.tabButtonActive]}
      >
        <ThemedText style={styles.tabIcon}>📦</ThemedText>
        <ThemedText
          variant="body"
          style={[styles.tabText, isInsumos && styles.tabTextActive]}
        >
          Insumos & Saldos
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSelectAba('fichas')}
        style={[styles.tabButton, isFichas && styles.tabButtonActive]}
      >
        <ThemedText style={styles.tabIcon}>🥗</ThemedText>
        <ThemedText
          variant="body"
          style={[styles.tabText, isFichas && styles.tabTextActive]}
        >
          Fichas Técnicas
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
    gap: 6,
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
    fontSize: 16,
  },
  tabText: {
    fontWeight: '700',
    fontSize: tokens.typography.fontSm,
    color: tokens.colors.textSecondary,
  },
  tabTextActive: {
    color: tokens.colors.white,
  },
});
