import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { TrialBadgeHeader, AssinaturaStatus } from '@/features/assinatura';
import { useSseStatus } from '@/shared';

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
  const sseStatus = useSseStatus((state) => state.status);
  const isSseActive = sseStatus === 'CONNECTED';

  // Iniciais do gestor para avatar compacto (ex: "Gestor Restaurante" -> "GR")
  const iniciais = (nomeGestor || 'Gestor')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || 'GR';

  return (
    <View style={styles.container}>
      {/* Lado Esquerdo: Identidade da Unidade + Status Operacional Integrado */}
      <View style={styles.ladoEsquerdo}>
        <View style={[styles.statusDot, isAberta ? styles.dotGreen : styles.dotGray]} />
        <View style={styles.textosContexto}>
          <ThemedText
            variant="subtitle"
            weight="bold"
            numberOfLines={1}
            style={styles.nomeRestaurante}
          >
            {nomeRestaurante || 'Restaurante Inteligente'}
          </ThemedText>
          <ThemedText variant="caption" style={styles.subtexto}>
            {turnoAtual || 'Turno Ativo'} • {isAberta ? 'Operação Ativa' : 'Loja Fechada'}
          </ThemedText>
        </View>
      </View>

      {/* Lado Direito: Telemetria Silenciosa + Micro-Chip de Trial + Avatar */}
      <View style={styles.ladoDireito}>
        {/* Micro-chip de Trial compacto (se estiver em período de testes) */}
        <TrialBadgeHeader
          assinatura={assinatura}
          onOpenPaywall={onOpenPaywall}
          variant="chip"
        />

        {/* Indicador discreto de sincronização SSE */}
        <View
          accessibilityLabel={isSseActive ? 'Tempo real conectado' : 'Conectando ao servidor'}
          style={[styles.badgeSse, isSseActive ? styles.sseConectado : styles.sseDesconectado]}
        >
          <View style={[styles.miniDot, isSseActive ? styles.dotGreen : styles.dotAmber]} />
          <ThemedText variant="caption" style={styles.sseTexto}>
            {isSseActive ? 'Live' : 'Sync'}
          </ThemedText>
        </View>

        {/* Avatar Compacto com Iniciais */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Perfil de ${nomeGestor || 'Gestor'}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={onOpenPaywall}
          style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]}
        >
          <ThemedText variant="caption" weight="bold" color={tokens.colors.primary}>
            {iniciais}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 52,
    backgroundColor: tokens.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
    paddingHorizontal: tokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ladoEsquerdo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: {
    backgroundColor: '#146C2E',
  },
  dotGray: {
    backgroundColor: '#8E8E93',
  },
  dotAmber: {
    backgroundColor: '#E65100',
  },
  textosContexto: {
    flex: 1,
  },
  nomeRestaurante: {
    fontSize: 14,
    color: tokens.colors.textPrimary,
    lineHeight: 18,
  },
  subtexto: {
    fontSize: 11,
    color: tokens.colors.textSecondary,
    lineHeight: 14,
  },
  ladoDireito: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeSse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: tokens.radii.full,
    backgroundColor: '#F4F3F7',
  },
  sseConectado: {
    backgroundColor: '#EBF9EE',
  },
  sseDesconectado: {
    backgroundColor: '#FFF8E1',
  },
  miniDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  sseTexto: {
    fontSize: 10,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDEEE9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  avatarPressed: {
    opacity: 0.7,
  },
});
