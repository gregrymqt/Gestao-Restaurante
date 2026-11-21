import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, ShieldCheck } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { FiltroRapidoEstoque } from '../types';

interface FiltrosRapidosInsumosProps {
  filtroAtivo: FiltroRapidoEstoque;
  onSelectFiltro: (filtro: FiltroRapidoEstoque) => void;
  totalTodos: number;
  totalCriticos: number;
  totalSeguros: number;
}

export function FiltrosRapidosInsumos({
  filtroAtivo,
  onSelectFiltro,
  totalTodos,
  totalCriticos,
  totalSeguros,
}: FiltrosRapidosInsumosProps) {
  return (
    <View style={styles.container}>
      {/* Filtro: Todos */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSelectFiltro('todos')}
        style={[styles.pill, filtroAtivo === 'todos' && styles.pillActive]}
        accessibilityRole="button"
        accessibilityState={{ selected: filtroAtivo === 'todos' }}
        accessibilityLabel={`Filtrar todos os ${totalTodos} insumos`}
      >
        <ThemedText
          variant="caption"
          style={[styles.pillText, filtroAtivo === 'todos' && styles.pillTextActive]}
        >
          Todos ({totalTodos})
        </ThemedText>
      </TouchableOpacity>

      {/* Filtro: Críticos */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSelectFiltro('criticos')}
        style={[
          styles.pill,
          filtroAtivo === 'criticos' && styles.pillCriticosActive,
          totalCriticos > 0 && styles.pillCriticosHasItems,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: filtroAtivo === 'criticos' }}
        accessibilityLabel={`Filtrar ${totalCriticos} insumos críticos`}
      >
        <AlertTriangle
          size={12}
          color={filtroAtivo === 'criticos' ? tokens.colors.white : tokens.colors.status.redText}
          style={styles.iconMargin}
        />
        <ThemedText
          variant="caption"
          style={[styles.pillTextCritico, filtroAtivo === 'criticos' && styles.pillTextCriticoActive]}
        >
          Críticos ({totalCriticos})
        </ThemedText>
      </TouchableOpacity>

      {/* Filtro: Seguros */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSelectFiltro('seguros')}
        style={[styles.pill, filtroAtivo === 'seguros' && styles.pillSegurosActive]}
        accessibilityRole="button"
        accessibilityState={{ selected: filtroAtivo === 'seguros' }}
        accessibilityLabel={`Filtrar ${totalSeguros} insumos seguros`}
      >
        <ShieldCheck
          size={13}
          color={filtroAtivo === 'seguros' ? tokens.colors.white : tokens.colors.status.greenText}
          style={styles.iconMargin}
        />
        <ThemedText
          variant="caption"
          style={[styles.pillTextSeguro, filtroAtivo === 'seguros' && styles.pillTextSeguroActive]}
        >
          Seguros ({totalSeguros})
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radii.full,
    minHeight: 34,
  },
  pillActive: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  pillTextActive: {
    color: tokens.colors.white,
    fontWeight: '700',
  },
  pillCriticosHasItems: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  pillCriticosActive: {
    backgroundColor: tokens.colors.status.redText,
    borderColor: tokens.colors.status.redText,
  },
  pillTextCritico: {
    fontSize: 12,
    fontWeight: '700',
    color: tokens.colors.status.redText,
  },
  pillTextCriticoActive: {
    color: tokens.colors.white,
  },
  pillSegurosActive: {
    backgroundColor: tokens.colors.status.greenText,
    borderColor: tokens.colors.status.greenText,
  },
  pillTextSeguro: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.colors.status.greenText,
  },
  pillTextSeguroActive: {
    color: tokens.colors.white,
    fontWeight: '700',
  },
  iconMargin: {
    marginRight: 4,
  },
});
