import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { StatusSessaoCaixa } from '../types';

interface ContextoOperacionalHeaderProps {
  status: StatusSessaoCaixa;
  terminal?: string;
  dataHora?: string;
  turno: string;
  operador?: string;
  isOffline?: boolean;
  onPressAvatar?: () => void;
  onPressVoltar?: () => void;
}

export function ContextoOperacionalHeader({
  status,
  turno,
  operador = 'Lucas Vicente',
  isOffline = false,
  onPressAvatar,
  onPressVoltar,
}: ContextoOperacionalHeaderProps) {
  const isAberta = status === 'Aberta';

  // Extrai iniciais do operador (ex: "Lucas Vicente" -> "LV")
  const iniciaisOperador = operador
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join('') || 'LV';

  const dotEstilo = isOffline
    ? styles.dotOffline
    : isAberta
    ? styles.dotAberta
    : styles.dotFechada;

  return (
    <View style={styles.container}>
      {/* Esquerda: Botão Voltar */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar para o Painel"
        onPress={onPressVoltar}
        style={({ pressed }) => [styles.btnVoltar, pressed && styles.pressed]}
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={16} color={tokens.colors.primary} />
        <ThemedText variant="caption" weight="bold" color={tokens.colors.primary}>
          Painel
        </ThemedText>
      </Pressable>

      {/* Centro: Título + Badge de Turno */}
      <View style={styles.centroRow}>
        <ThemedText variant="subtitle" weight="bold" style={styles.tituloTexto}>
          Gestão do Caixa
        </ThemedText>
        <View style={styles.badgeTurno}>
          <ThemedText variant="caption" weight="bold" style={styles.textoTurno}>
            {turno}
          </ThemedText>
        </View>
      </View>

      {/* Direita: Dot de Status + Avatar */}
      <View style={styles.dirRow}>
        <View
          accessibilityRole="image"
          style={[styles.dotStatus, dotEstilo]}
          accessibilityLabel={isOffline ? 'Conexão offline' : isAberta ? 'Caixa aberto' : 'Caixa fechado'}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Perfil do Operador"
          style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
          onPress={onPressAvatar}
          hitSlop={8}
        >
          <ThemedText variant="caption" weight="bold" color={tokens.colors.primary}>
            {iniciaisOperador}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  btnVoltar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  centroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  tituloTexto: {
    fontSize: tokens.typography.fontMd,
  },
  badgeTurno: {
    backgroundColor: tokens.colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  textoTurno: {
    fontSize: tokens.typography.fontXs,
    color: tokens.colors.textSecondary,
  },
  dirRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  dotStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotAberta: {
    backgroundColor: tokens.colors.status.greenText,
  },
  dotFechada: {
    backgroundColor: tokens.colors.status.redText,
  },
  dotOffline: {
    backgroundColor: tokens.colors.status.redText,
  },
  avatarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: tokens.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
});
