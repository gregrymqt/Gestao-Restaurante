import React from 'react';
import { View, StyleSheet, TextInput, Pressable } from 'react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';

interface PilulaValor {
  id: string;
  label: string;
  valor: number;
}

interface PainelDinheiroTrocoProps {
  subtotal: number;
  valorRecebidoInput: string;
  aoMudarValorRecebido: (valor: string) => void;
  pilulasCalculadas: PilulaValor[];
  pilulaSelecionada: string;
  aoSelecionarPilula: (id: string, valor: number) => void;
  troco: number;
  isValorInsuficiente: boolean;
  valorRecebidoNumerico: number;
}

export function PainelDinheiroTroco({
  subtotal,
  valorRecebidoInput,
  aoMudarValorRecebido,
  pilulasCalculadas,
  pilulaSelecionada,
  aoSelecionarPilula,
  troco,
  isValorInsuficiente,
  valorRecebidoNumerico,
}: PainelDinheiroTrocoProps) {
  return (
    <View style={styles.painelDinheiro}>
      <View style={styles.painelDinheiroHeader}>
        <ThemedText variant="subtitle" style={styles.labelDinheiro}>
          Valor Recebido em Espécie
        </ThemedText>
        <ThemedText variant="caption" style={styles.labelTeclado}>
          Teclado numérico
        </ThemedText>
      </View>

      {/* Input de Valor Recebido */}
      <View style={styles.inputDinheiroWrapper}>
        <ThemedText variant="title" style={styles.prefixoMoeda}>
          R$
        </ThemedText>
        <TextInput
          accessibilityRole="text"
          accessibilityLabel="Valor recebido em dinheiro"
          style={styles.inputDinheiro}
          keyboardType="decimal-pad"
          value={valorRecebidoInput}
          onChangeText={aoMudarValorRecebido}
        />
      </View>

      {/* Pílulas de Valor Rápido */}
      <View style={styles.pilulasRow}>
        {pilulasCalculadas.map((pilula) => {
          const isAtiva = pilulaSelecionada === pilula.id;

          return (
            <Pressable
              key={pilula.id}
              accessibilityRole="button"
              accessibilityLabel={pilula.label}
              style={[
                styles.pilulaDinheiro,
                isAtiva && styles.pilulaDinheiroAtiva,
              ]}
              onPress={() => aoSelecionarPilula(pilula.id, pilula.valor)}
            >
              <ThemedText
                variant="caption"
                weight="bold"
                style={[
                  styles.textoPilula,
                  isAtiva && styles.textoPilulaAtiva,
                ]}
              >
                {pilula.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {/* Box de Troco / Aviso de Insuficiência */}
      {isValorInsuficiente ? (
        <View style={styles.avisoInsuficienteBox}>
          <ThemedText
            variant="caption"
            weight="bold"
            color={tokens.colors.status.redText}
          >
            ⚠️ Valor insuficiente. Faltam R${' '}
            {(subtotal - valorRecebidoNumerico).toFixed(2).replace('.', ',')}
          </ThemedText>
        </View>
      ) : (
        <View style={styles.trocoBox}>
          <View style={styles.trocoEsquerda}>
            <View style={styles.checkCirculo}>
              <ThemedText variant="caption" style={styles.checkIcon}>
                ✓
              </ThemedText>
            </View>
            <ThemedText variant="subtitle" style={styles.textoTrocoLabel}>
              Troco a Devolver:
            </ThemedText>
          </View>
          <ThemedText variant="title" style={styles.valorTroco}>
            R$ {troco.toFixed(2).replace('.', ',')}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  painelDinheiro: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  painelDinheiroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.sm,
  },
  labelDinheiro: {
    fontSize: tokens.typography.fontSm,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  labelTeclado: {
    fontSize: tokens.typography.fontXs,
    color: tokens.colors.textMuted,
  },
  inputDinheiroWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.card,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.md,
    height: 48,
    marginBottom: tokens.spacing.md,
  },
  prefixoMoeda: {
    fontSize: tokens.typography.fontLg,
    color: tokens.colors.textMuted,
    fontWeight: '700',
    marginRight: tokens.spacing.xs,
  },
  inputDinheiro: {
    flex: 1,
    fontSize: tokens.typography.fontXl,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    height: 48,
  },
  pilulasRow: {
    flexDirection: 'row',
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.md,
  },
  pilulaDinheiro: {
    flex: 1,
    height: 38,
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  pilulaDinheiroAtiva: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  textoPilula: {
    fontSize: 11,
    color: tokens.colors.textPrimary,
  },
  textoPilulaAtiva: {
    color: tokens.colors.white,
  },
  trocoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.colors.status.greenBg,
    borderWidth: 1,
    borderColor: '#BCEBCB',
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  trocoEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  checkCirculo: {
    width: 22,
    height: 22,
    borderRadius: tokens.radii.full,
    backgroundColor: tokens.colors.status.greenText,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: tokens.colors.white,
    fontWeight: '800',
    fontSize: 12,
  },
  textoTrocoLabel: {
    fontSize: tokens.typography.fontSm,
    fontWeight: '700',
    color: tokens.colors.status.greenText,
  },
  valorTroco: {
    fontSize: tokens.typography.fontLg,
    fontWeight: '800',
    color: tokens.colors.status.greenText,
  },
  avisoInsuficienteBox: {
    backgroundColor: tokens.colors.status.redBg,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.sm,
    alignItems: 'center',
  },
});
