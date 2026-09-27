import React from 'react';
import { View, StyleSheet } from 'react-native';
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
          <ThemedText style={styles.weatherIcon}>⛅</ThemedText>
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
        <ThemedText style={styles.bulbIcon}>💡</ThemedText>
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
    backgroundColor: '#F0F4F8',
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: '#D2E3FC',
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
    gap: 6,
  },
  weatherIcon: {
    fontSize: 18,
  },
  title: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '800',
    color: '#1A73E8',
  },
  iaBadge: {
    backgroundColor: '#E8F0FE',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radii.full,
    borderWidth: 1,
    borderColor: '#AECBFA',
  },
  iaBadgeText: {
    color: '#1967D2',
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
    borderColor: '#E8EAED',
  },
  bulbIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  impactText: {
    flex: 1,
    color: '#3C4043',
    lineHeight: 18,
    fontWeight: '500',
    fontSize: tokens.typography.fontXs,
  },
});
