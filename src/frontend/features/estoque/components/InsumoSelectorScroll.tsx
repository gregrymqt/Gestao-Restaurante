import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { InsumoEstoque } from '../types';

interface InsumoSelectorScrollProps {
  insumoInicial: InsumoEstoque | null;
  todosInsumos: InsumoEstoque[];
  insumoSelecionadoId: string;
  onSelectInsumo: (id: string) => void;
}

export function InsumoSelectorScroll({
  insumoInicial,
  todosInsumos,
  insumoSelecionadoId,
  onSelectInsumo,
}: InsumoSelectorScrollProps) {
  if (insumoInicial) {
    return (
      <View style={styles.insumoFixoBox}>
        <ThemedText variant="body" style={styles.insumoFixoNome}>
          {insumoInicial.nome}
        </ThemedText>
        <ThemedText variant="caption" color={tokens.colors.textMuted}>
          {insumoInicial.localizacao} • Saldo atual: {insumoInicial.saldoAtual} {insumoInicial.unidadeMedida}
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.insumosSelector}
    >
      {todosInsumos.map((item) => {
        const isSelected = item.id === insumoSelecionadoId;
        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            onPress={() => onSelectInsumo(item.id)}
            style={[styles.insumoPill, isSelected && styles.insumoPillActive]}
          >
            <ThemedText
              variant="caption"
              style={[styles.insumoPillText, isSelected && styles.insumoPillTextActive]}
            >
              {item.nome}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  insumoFixoBox: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.sm,
    marginBottom: tokens.spacing.sm,
  },
  insumoFixoNome: {
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  insumosSelector: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: tokens.spacing.sm,
    paddingVertical: 4,
  },
  insumoPill: {
    backgroundColor: '#F1F3F4',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 6,
    borderRadius: tokens.radii.full,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  insumoPillActive: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  insumoPillText: {
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  insumoPillTextActive: {
    color: tokens.colors.white,
  },
});
