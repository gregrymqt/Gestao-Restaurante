import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { OperadorRecente } from '../types';

interface RecentOperatorsGridProps {
  operadores: OperadorRecente[];
  operadorAtivoId?: string;
  onSelectOperador: (operador: OperadorRecente) => void;
}

export function RecentOperatorsGrid({
  operadores,
  operadorAtivoId,
  onSelectOperador,
}: RecentOperatorsGridProps) {
  if (operadores.length === 0) return null;

  return (
    <View style={styles.container}>
      <ThemedText variant="caption" style={styles.sectionTitle}>
        OPERADORES RECENTES NO TERMINAL
      </ThemedText>

      <View style={styles.gridRow}>
        {operadores.slice(0, 2).map((op) => {
          const isSelected = op.id === operadorAtivoId;

          return (
            <TouchableOpacity
              key={op.id}
              activeOpacity={0.8}
              onPress={() => onSelectOperador(op)}
              style={[styles.operatorCard, isSelected && styles.operatorCardActive]}
            >
              <View style={styles.avatarInitialsBox}>
                <ThemedText variant="caption" weight="bold" style={styles.initialsText}>
                  {op.iniciais || 'OP'}
                </ThemedText>
              </View>

              <View style={styles.operatorInfo}>
                <ThemedText variant="caption" weight="bold" style={styles.operatorNome} numberOfLines={1}>
                  {op.nome}
                </ThemedText>
                <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.matriculaText}>
                  Matrícula {op.matricula}
                </ThemedText>
              </View>

              {isSelected && (
                <Ionicons name="checkmark-circle" size={16} color={tokens.colors.primary} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: tokens.colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  gridRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  operatorCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.sm,
    gap: tokens.spacing.sm,
  },
  operatorCardActive: {
    borderColor: tokens.colors.primary,
    backgroundColor: tokens.colors.primaryLight,
  },
  avatarInitialsBox: {
    width: 32,
    height: 32,
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: tokens.colors.primaryDark,
    fontSize: 11,
  },
  operatorInfo: {
    flex: 1,
  },
  operatorNome: {
    color: tokens.colors.textPrimary,
  },
  matriculaText: {
    fontSize: 10,
  },
});
