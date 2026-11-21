import React from 'react';
import { View, Pressable } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { formatarMoeda } from '@/shared/utils/formatters';
import { styles } from './ModalMovimentacaoCaixa.styles';

interface AtalhosValorChipsProps {
  isSuprimento: boolean;
  saldoDisponivel: number;
  onAdicionarValor: (valor: number) => void;
  onPreencherTudo: () => void;
}

export function AtalhosValorChips({
  isSuprimento,
  saldoDisponivel,
  onAdicionarValor,
  onPreencherTudo,
}: AtalhosValorChipsProps) {
  return (
    <View style={styles.chipsContainer}>
      <ThemedText variant="caption" style={styles.chipsLabel}>
        Atalhos de valor:
      </ThemedText>
      <View style={styles.chipsRow}>
        <Pressable
          style={styles.chip}
          onPress={() => onAdicionarValor(50)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Adicionar 50 reais"
        >
          <ThemedText variant="caption" weight="bold" color={tokens.colors.primary}>
            + R$ 50
          </ThemedText>
        </Pressable>

        <Pressable
          style={styles.chip}
          onPress={() => onAdicionarValor(100)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Adicionar 100 reais"
        >
          <ThemedText variant="caption" weight="bold" color={tokens.colors.primary}>
            + R$ 100
          </ThemedText>
        </Pressable>

        {isSuprimento ? (
          <Pressable
            style={styles.chip}
            onPress={() => onAdicionarValor(200)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Adicionar 200 reais"
          >
            <ThemedText variant="caption" weight="bold" color={tokens.colors.primary}>
              + R$ 200
            </ThemedText>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.chip, styles.chipTudo]}
            onPress={onPreencherTudo}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Preencher todo o saldo de ${formatarMoeda(saldoDisponivel)}`}
          >
            <ThemedText variant="caption" weight="bold" color={tokens.colors.status.redText}>
              Tudo ({formatarMoeda(saldoDisponivel)})
            </ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );
}
