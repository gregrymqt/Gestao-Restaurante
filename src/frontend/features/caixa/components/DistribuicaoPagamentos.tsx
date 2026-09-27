import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { MetodoPagamentoResumo } from '../types';

interface DistribuicaoPagamentosProps {
  pagamentos: readonly MetodoPagamentoResumo[];
}

export function DistribuicaoPagamentos({ pagamentos }: DistribuicaoPagamentosProps) {
  return (
    <View style={styles.container}>
      {/* Título da Seção e Quantidade de Modalidades */}
      <View style={styles.headerRow}>
        <ThemedText variant="subtitle" style={styles.tituloSecao}>
          Entradas por Método de Pagamento
        </ThemedText>
        <ThemedText variant="caption" style={styles.modalidadesTexto}>
          {pagamentos.length} modalidades
        </ThemedText>
      </View>

      {/* Barra Proporcional Segmentada (Flexbox Puro) */}
      <View style={styles.barraProporcionalContainer}>
        {pagamentos.map((metodo) => (
          <View
            key={`barra-${metodo.id}`}
            style={[
              styles.segmentoBarra,
              {
                flex: metodo.percentual,
                backgroundColor: metodo.corBarra,
              },
            ]}
          />
        ))}
      </View>

      {/* Lista de Modalidades de Pagamento */}
      <View style={styles.listaModalidades}>
        {pagamentos.map((metodo) => {
          const isGaveta = metodo.badge === 'Gaveta OK';
          const isInstantaneo = metodo.badge === 'Instantâneo';

          return (
            <View key={metodo.id} style={styles.cardModalidade}>
              <View style={styles.cardEsquerda}>
                <View style={styles.iconeWrapper}>
                  <ThemedText variant="title">{metodo.icone}</ThemedText>
                </View>

                <View style={styles.infoCol}>
                  <View style={styles.nomeRow}>
                    <ThemedText variant="subtitle" style={styles.nomeModalidade}>
                      {metodo.nome}
                    </ThemedText>
                    {isInstantaneo && (
                      <View style={styles.badgeVerde}>
                        <ThemedText
                          variant="caption"
                          weight="bold"
                          color={tokens.colors.status.greenText}
                          style={styles.badgeTexto}
                        >
                          Instantâneo
                        </ThemedText>
                      </View>
                    )}
                    {isGaveta && (
                      <View style={styles.badgeVerde}>
                        <ThemedText
                          variant="caption"
                          weight="bold"
                          color={tokens.colors.status.greenText}
                          style={styles.badgeTexto}
                        >
                          ✓ Gaveta OK
                        </ThemedText>
                      </View>
                    )}
                  </View>

                  <ThemedText variant="caption" style={styles.subtextoModalidade}>
                    {metodo.transacoesTexto}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.cardDireita}>
                <ThemedText variant="subtitle" style={styles.valorModalidade}>
                  R$ {metodo.valor.toFixed(2).replace('.', ',')}
                </ThemedText>
                <ThemedText variant="caption" style={styles.percentualTexto}>
                  {metodo.percentual}% do volume
                </ThemedText>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.sm,
  },
  tituloSecao: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  modalidadesTexto: {
    fontSize: tokens.typography.fontXs,
    color: tokens.colors.textMuted,
  },
  barraProporcionalContainer: {
    flexDirection: 'row',
    height: 10,
    borderRadius: tokens.radii.full,
    overflow: 'hidden',
    backgroundColor: tokens.colors.border,
    marginBottom: tokens.spacing.md,
    gap: 2,
  },
  segmentoBarra: {
    height: '100%',
  },
  listaModalidades: {
    gap: tokens.spacing.sm,
  },
  cardModalidade: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
  },
  cardEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    flex: 1,
  },
  iconeWrapper: {
    width: 40,
    height: 40,
    borderRadius: tokens.radii.md,
    backgroundColor: tokens.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
  },
  nomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  nomeModalidade: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  badgeVerde: {
    backgroundColor: tokens.colors.status.greenBg,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: tokens.radii.sm,
  },
  badgeTexto: {
    fontSize: 9,
  },
  subtextoModalidade: {
    fontSize: tokens.typography.fontXs,
    color: tokens.colors.textMuted,
    marginTop: 2,
  },
  cardDireita: {
    alignItems: 'flex-end',
  },
  valorModalidade: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  percentualTexto: {
    fontSize: tokens.typography.fontXs,
    color: tokens.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
});
