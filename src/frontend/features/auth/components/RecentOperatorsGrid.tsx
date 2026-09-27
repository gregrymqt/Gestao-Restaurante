import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
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
              {op.iniciais === 'LV' ? (
                <View style={styles.avatarPhotoBox}>
                  <ThemedText style={styles.avatarEmoji}>👨‍🍳</ThemedText>
                </View>
              ) : (
                <View style={styles.avatarInitialsBox}>
                  <ThemedText variant="caption" style={styles.initialsText}>
                    {op.iniciais || 'MA'}
                  </ThemedText>
                </View>
              )}

              <View style={styles.operatorInfo}>
                <ThemedText variant="caption" style={styles.operatorNome} numberOfLines={1}>
                  {op.nome}
                </ThemedText>
                <ThemedText variant="caption" color={tokens.colors.textMuted} style={styles.matriculaText}>
                  Matrícula {op.matricula}
                </ThemedText>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: tokens.spacing.md,
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
    padding: tokens.spacing.xs + 2,
    gap: tokens.spacing.xs,
  },
  operatorCardActive: {
    borderColor: tokens.colors.primary,
    backgroundColor: '#FFF9F8',
  },
  avatarPhotoBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFECE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 18,
  },
  avatarInitialsBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8EAED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontWeight: '800',
    color: tokens.colors.textSecondary,
    fontSize: 11,
  },
  operatorInfo: {
    flex: 1,
  },
  operatorNome: {
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  matriculaText: {
    fontSize: 10,
    marginTop: 1,
  },
});
