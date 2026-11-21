import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Banknote, AlertTriangle } from 'lucide-react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';

interface ConferenciaGavetaBoxProps {
  valorDinheiro: number;
}

export function ConferenciaGavetaBox({ valorDinheiro }: ConferenciaGavetaBoxProps) {
  const valorFormatado = valorDinheiro.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <View style={styles.container}>
      {/* Alerta de Conferência Física de Dinheiro em Gaveta */}
      <View style={styles.gavetaBox}>
        <View style={styles.gavetaHeader}>
          <Banknote size={18} color="#8D6E63" />
          <ThemedText variant="subtitle" style={styles.tituloGaveta}>
            Conferência Física da Gaveta
          </ThemedText>
        </View>
        <ThemedText variant="body" style={styles.textoGaveta}>
          Confira o dinheiro em espécie no caixa antes de prosseguir. O
          sistema apurou o montante de:
        </ThemedText>
        <View style={styles.valorGavetaBadge}>
          <ThemedText
            variant="title"
            weight="bold"
            color="#B25E00"
            style={styles.valorGavetaTexto}
          >
            {valorFormatado} em cédulas/moedas
          </ThemedText>
        </View>
      </View>

      {/* Aviso de Irreversibilidade e Disparo RabbitMQ */}
      <View style={styles.avisoBox}>
        <AlertTriangle size={18} color={tokens.colors.status.redText} style={styles.iconeAviso} />
        <View style={styles.avisoCol}>
          <ThemedText
            variant="caption"
            weight="bold"
            color={tokens.colors.status.redText}
          >
            Ação Irreversível de Encerramento
          </ThemedText>
          <ThemedText variant="caption" style={styles.textoAviso}>
            O encerramento fechará a sessão ativa, consolidará as vendas
            do turno e sincronizará os registros fiscais com a gestão central.
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
  },
  gavetaBox: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: '#FFE082',
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  gavetaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    marginBottom: 4,
  },
  tituloGaveta: {
    fontSize: tokens.typography.fontSm,
    fontWeight: '700',
    color: '#8D6E63',
  },
  textoGaveta: {
    fontSize: tokens.typography.fontXs,
    color: '#5D4037',
    lineHeight: 18,
  },
  valorGavetaBadge: {
    backgroundColor: '#FFE082',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 4,
    borderRadius: tokens.radii.sm,
    marginTop: tokens.spacing.xs,
    alignSelf: 'flex-start',
  },
  valorGavetaTexto: {
    fontSize: tokens.typography.fontSm,
  },
  avisoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: tokens.spacing.sm,
    backgroundColor: tokens.colors.status.redBg,
    borderWidth: 1,
    borderColor: '#F2B8B5',
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
  },
  iconeAviso: {
    fontSize: 16,
    marginTop: 2,
  },
  avisoCol: {
    flex: 1,
  },
  textoAviso: {
    fontSize: 11,
    color: tokens.colors.status.redText,
    marginTop: 2,
    lineHeight: 16,
  },
});
