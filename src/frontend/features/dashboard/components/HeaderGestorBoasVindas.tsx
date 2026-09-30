import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { TrialBadgeHeader, AssinaturaStatus } from '@/features/assinatura';

interface HeaderGestorBoasVindasProps {
  nomeGestor: string;
  nomeRestaurante: string;
  statusLoja: 'ABERTA' | 'FECHADA';
  turnoAtual: string;
  assinatura: AssinaturaStatus;
  onOpenPaywall: () => void;
}

export function HeaderGestorBoasVindas({
  nomeGestor,
  nomeRestaurante,
  statusLoja,
  turnoAtual,
  assinatura,
  onOpenPaywall,
}: HeaderGestorBoasVindasProps) {
  const isAberta = statusLoja === 'ABERTA';

  return (
    <View style={styles.container}>
      {/* Banner de Trial / Assinatura SaaS */}
      <TrialBadgeHeader assinatura={assinatura} onOpenPaywall={onOpenPaywall} />

      <View style={styles.headerRow}>
        <View style={styles.textos}>
          <View style={styles.saudacaoRow}>
            <ThemedText variant="caption" weight="bold" color={tokens.colors.primary}>
              PAINEL DE GESTÃO DO DONO
            </ThemedText>
            <View style={[styles.badgeStatus, isAberta ? styles.badgeAberta : styles.badgeFechada]}>
              <View style={[styles.pontoStatus, isAberta ? styles.pontoVerde : styles.pontoVermelho]} />
              <ThemedText
                variant="caption"
                weight="bold"
                color={isAberta ? tokens.colors.status.greenText : tokens.colors.status.redText}
              >
                {isAberta ? 'Operação Ativa' : 'Loja Fechada'}
              </ThemedText>
            </View>
          </View>

          <ThemedText variant="title" style={styles.titulo}>
            Olá, {nomeGestor || 'Gestor'} 👋
          </ThemedText>
          <ThemedText variant="caption" style={styles.subtitulo}>
            {nomeRestaurante} • {turnoAtual}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: tokens.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.sm,
    paddingBottom: tokens.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textos: {
    flex: 1,
  },
  saudacaoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badgeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radii.full,
  },
  badgeAberta: {
    backgroundColor: tokens.colors.status.greenBg,
  },
  badgeFechada: {
    backgroundColor: tokens.colors.status.redBg,
  },
  pontoStatus: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pontoVerde: {
    backgroundColor: tokens.colors.status.greenText,
  },
  pontoVermelho: {
    backgroundColor: tokens.colors.status.redText,
  },
  titulo: {
    fontSize: tokens.typography.fontXl,
  },
  subtitulo: {
    color: tokens.colors.textMuted,
    marginTop: 2,
  },
});
