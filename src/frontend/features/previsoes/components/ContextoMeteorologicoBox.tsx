import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CloudSun, Sparkles } from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

interface ContextoMeteorologicoBoxProps {
  temperatura?: number;
  condicao?: string;
  precipitacaoMm?: number;
  impactoDescricao?: string;
}

export function ContextoMeteorologicoBox({
  temperatura = 26,
  condicao = 'Céu claro a parc. chuva',
  precipitacaoMm = 1.2,
  impactoDescricao = 'Alta temperatura combinada a garoa pontual eleva a demanda de bebidas geladas (+12%) e fluxo em balcão (+8%).',
}: ContextoMeteorologicoBoxProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <CloudSun size={20} color="#D97706" />
          <ThemedText variant="title" style={styles.title}>
            Contexto Meteorológico
          </ThemedText>
        </View>

        <View style={styles.iaBadge}>
          <ThemedText variant="caption" style={styles.iaBadgeText}>
            IA Telemetria
          </ThemedText>
        </View>
      </View>

      <View style={styles.telemetryRow}>
        <ThemedText variant="body" style={styles.forecastText}>
          Previsão:{' '}
          <ThemedText variant="body" style={styles.forecastHighlight}>
            {temperatura}°C
          </ThemedText>{' '}
          | {condicao} ({precipitacaoMm.toFixed(1)} mm)
        </ThemedText>
      </View>

      <View style={styles.impactBox}>
        <Sparkles size={16} color="#D97706" style={styles.sparklesIcon} />
        <ThemedText variant="caption" style={styles.impactText}>
          {impactoDescricao}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.xl,
    backgroundColor: '#F9FAFB',
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xs,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '800',
    color: '#111827',
  },
  iaBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radii.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  iaBadgeText: {
    color: '#92400E',
    fontWeight: '700',
    fontSize: tokens.typography.fontXs,
    letterSpacing: 0.3,
  },
  telemetryRow: {
    marginBottom: tokens.spacing.sm,
  },
  forecastText: {
    color: tokens.colors.textPrimary,
    fontSize: tokens.typography.fontSm,
  },
  forecastHighlight: {
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  impactBox: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.sm,
    gap: tokens.spacing.xs,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    alignItems: 'flex-start',
  },
  sparklesIcon: {
    marginTop: 2,
    flexShrink: 0,
  },
  impactText: {
    flex: 1,
    color: '#374151',
    lineHeight: 18,
    fontWeight: '500',
    fontSize: tokens.typography.fontXs,
  },
});
