import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { DataOpcaoFiltro } from '../types';

interface PrevisoesHeaderProps {
  datasFiltro: DataOpcaoFiltro[];
  dataSelecionada: string;
  onSelectData: (dataAlvo: string) => void;
  onDispararIa?: () => void;
  isDisparandoIa?: boolean;
  isOffline?: boolean;
}

export function PrevisoesHeader({
  datasFiltro,
  dataSelecionada,
  onSelectData,
  onDispararIa,
  isDisparandoIa = false,
  isOffline = false,
}: PrevisoesHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <ThemedText variant="title" style={styles.title}>
          Previsões de Demanda
        </ThemedText>

        {onDispararIa && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Recalcular Previsões com Inteligência Artificial"
            activeOpacity={0.8}
            disabled={isDisparandoIa}
            onPress={onDispararIa}
            style={[styles.btnRecalcular, isDisparandoIa && styles.btnRecalcularDesabilitado]}
          >
            {isDisparandoIa ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.btnRecalcularInner}>
                <Sparkles size={13} color="#FFFFFF" />
                <ThemedText variant="caption" weight="bold" color="#FFFFFF" style={styles.btnRecalcularText}>
                  Recalcular IA
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.badgesRow}>
        <View style={[styles.syncBadge, isOffline && styles.syncBadgeOffline]}>
          <View style={[styles.greenDot, isOffline && styles.amberDot]} />
          <ThemedText
            variant="caption"
            style={[styles.syncBadgeText, isOffline && styles.syncBadgeTextOffline]}
          >
            {isOffline ? 'Cache Local (Offline)' : 'IA SINCRONIZADA'}
          </ThemedText>
        </View>

        <View style={styles.modelBadge}>
          <ThemedText variant="caption" style={styles.modelBadgeText}>
            IA CALIBRADA
          </ThemedText>
        </View>
      </View>

      <ThemedText variant="body" color={tokens.colors.textMuted} style={styles.subtitle}>
        Projeção de consumo e capacidade de estoque baseada em machine learning
      </ThemedText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsScroll}
      >
        {datasFiltro.map((item) => {
          const isSelected = item.dataAlvo === dataSelecionada;
          return (
            <TouchableOpacity
              key={item.dataAlvo}
              activeOpacity={0.8}
              onPress={() => onSelectData(item.dataAlvo)}
              style={[styles.pillButton, isSelected && styles.pillButtonActive]}
            >
              <ThemedText
                variant="body"
                style={[styles.pillText, isSelected && styles.pillTextActive]}
              >
                {item.label}{' '}
                <ThemedText
                  variant="caption"
                  style={[styles.pillSubtext, isSelected && styles.pillSubtextActive]}
                >
                  {item.sublabel}
                </ThemedText>
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
    paddingBottom: tokens.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xs,
  },
  btnRecalcular: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: tokens.radii.full,
    minHeight: 32,
    justifyContent: 'center',
  },
  btnRecalcularDesabilitado: {
    opacity: 0.6,
  },
  btnRecalcularInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnRecalcularText: {
    fontSize: 12,
  },
  title: {
    fontSize: tokens.typography.fontXxl,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.xs,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.status.greenBg,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: tokens.radii.full,
    gap: 6,
  },
  syncBadgeOffline: {
    backgroundColor: '#FEF3C7',
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: tokens.colors.status.greenText,
  },
  amberDot: {
    backgroundColor: '#D97706',
  },
  syncBadgeText: {
    color: tokens.colors.status.greenText,
    fontWeight: '700',
    fontSize: tokens.typography.fontXs,
    letterSpacing: 0.4,
  },
  syncBadgeTextOffline: {
    color: '#92400E',
  },
  modelBadge: {
    backgroundColor: '#F1F3F4',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: tokens.radii.full,
  },
  modelBadgeText: {
    color: '#5F6368',
    fontWeight: '600',
    fontSize: tokens.typography.fontXs,
  },
  subtitle: {
    fontSize: tokens.typography.fontSm,
    lineHeight: 18,
    marginBottom: tokens.spacing.md,
  },
  pillsScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingRight: tokens.spacing.md,
  },
  pillButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillButtonActive: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  pillText: {
    fontWeight: '600',
    fontSize: tokens.typography.fontXs,
    color: tokens.colors.textPrimary,
  },
  pillTextActive: {
    color: tokens.colors.white,
  },
  pillSubtext: {
    color: tokens.colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  pillSubtextActive: {
    color: '#FCE8E6',
    fontWeight: '700',
  },
});
