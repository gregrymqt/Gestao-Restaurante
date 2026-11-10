import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { StatusPreparoKds } from '../types';

export type AbaKdsAtiva = Extract<StatusPreparoKds, 'RECEBIDO' | 'EM_PREPARO' | 'PRONTO'>;

interface KdsFiltrosAbasProps {
  abaAtiva: AbaKdsAtiva;
  onChangeAba: (aba: AbaKdsAtiva) => void;
  contadores: {
    recebidos: number;
    emPreparo: number;
    prontos: number;
  };
}

export function KdsFiltrosAbas({ abaAtiva, onChangeAba, contadores }: KdsFiltrosAbasProps) {
  const abas: Array<{ id: AbaKdsAtiva; label: string; count: number; cor: string }> = [
    { id: 'RECEBIDO', label: 'Novos', count: contadores.recebidos, cor: '#EA580C' },
    { id: 'EM_PREPARO', label: 'Em Preparo', count: contadores.emPreparo, cor: '#D97706' },
    { id: 'PRONTO', label: 'Prontos', count: contadores.prontos, cor: '#16A34A' },
  ];

  return (
    <View style={styles.container}>
      {abas.map((aba) => {
        const ativa = abaAtiva === aba.id;
        return (
          <Pressable
            key={aba.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: ativa }}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            onPress={() => onChangeAba(aba.id)}
            style={[
              styles.aba,
              ativa && { backgroundColor: '#FFF5F2', borderColor: aba.cor },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: aba.cor }]} />
            <ThemedText
              variant="caption"
              weight={ativa ? 'bold' : 'medium'}
              style={[styles.label, ativa && { color: aba.cor }]}
            >
              {aba.label}
            </ThemedText>
            <View style={[styles.badge, { backgroundColor: ativa ? aba.cor : '#E5E7EB' }]}>
              <ThemedText
                variant="caption"
                weight="bold"
                style={[styles.badgeText, ativa && { color: '#FFFFFF' }]}
              >
                {aba.count}
              </ThemedText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: tokens.spacing.xs + 2,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    backgroundColor: tokens.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  aba: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 42,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.background,
    paddingHorizontal: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    color: tokens.colors.textPrimary,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 11,
    color: '#374151',
  },
});
