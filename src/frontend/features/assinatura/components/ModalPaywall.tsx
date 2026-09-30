import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { PlanoItem, AssinaturaStatus } from '../types';

interface ModalPaywallProps {
  visible: boolean;
  assinatura: AssinaturaStatus;
  isAssinando: boolean;
  onConfirmar: (planoId: string) => void;
  onClose: () => void;
}

export function ModalPaywall({
  visible,
  assinatura,
  isAssinando,
  onConfirmar,
  onClose,
}: ModalPaywallProps) {
  const planos = assinatura.planosDisponiveis;
  const planoProPadrao = planos.find((p) => p.possuiModuloIa)?.id || planos[0]?.id || '';
  const [planoSelecionadoId, setPlanoSelecionadoId] = useState<string>(planoProPadrao);

  const planoAtivo = planos.find((p) => p.id === planoSelecionadoId) || planos[0];

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar tela de planos"
          style={styles.backdrop}
          onPress={onClose}
        />

        <View style={styles.sheet}>
          <View style={styles.dragIndicator} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Header com Ícone e Título */}
            <View style={styles.header}>
              <View style={styles.badgeTopo}>
                <ThemedText variant="caption" weight="bold" color={tokens.colors.primary}>
                  ESCALABILIDADE SAAS
                </ThemedText>
              </View>
              <ThemedText variant="title" style={styles.titulo}>
                Escolha o Plano do seu Restaurante
              </ThemedText>
              <ThemedText variant="body" style={styles.subtitulo}>
                {assinatura.diasRestantesTrial > 0
                  ? `Você ainda possui ${assinatura.diasRestantesTrial} dias de teste grátis. Ao assinar agora, você garante continuidade sem interrupções.`
                  : 'Seu período de degustação encerrou. Assine para continuar tendo controle total do seu negócio.'}
              </ThemedText>
            </View>

            {/* Lista dos Planos */}
            <View style={styles.planosContainer}>
              {planos.map((plano) => {
                const isSelecionado = plano.id === planoSelecionadoId;
                const isPro = plano.possuiModuloIa;

                return (
                  <Pressable
                    key={plano.id}
                    onPress={() => setPlanoSelecionadoId(plano.id)}
                    style={[
                      styles.cardPlano,
                      isSelecionado && styles.cardPlanoSelecionado,
                      isPro && styles.cardPlanoDestaque,
                    ]}
                  >
                    {isPro && (
                      <View style={styles.tagRecomendado}>
                        <ThemedText variant="caption" weight="bold" color={tokens.colors.white}>
                          ★ MAIS POPULAR & INTELIGENTE
                        </ThemedText>
                      </View>
                    )}

                    <View style={styles.cardPlanoHeader}>
                      <View style={styles.radioRow}>
                        <View style={[styles.radioOuter, isSelecionado && styles.radioOuterSelected]}>
                          {isSelecionado && <View style={styles.radioInner} />}
                        </View>
                        <ThemedText variant="subtitle" weight="bold" style={styles.nomePlano}>
                          {plano.nome}
                        </ThemedText>
                      </View>

                      <View style={styles.precoContainer}>
                        <ThemedText variant="title" weight="bold" color={tokens.colors.primary}>
                          R$ {plano.precoMensal.toFixed(2).replace('.', ',')}
                        </ThemedText>
                        <ThemedText variant="caption" style={styles.precoPeriodo}>
                          /mês
                        </ThemedText>
                      </View>
                    </View>

                    <ThemedText variant="caption" style={styles.descricaoPlano}>
                      {plano.descricao}
                    </ThemedText>

                    {/* Vantagens */}
                    <View style={styles.vantagensLista}>
                      <View style={styles.vantagemItem}>
                        <ThemedText style={styles.checkIcon}>✓</ThemedText>
                        <ThemedText variant="caption" style={styles.vantagemTexto}>
                          Gestão de Estoque Anti-Deadlock e Livro-Razão Imutável
                        </ThemedText>
                      </View>
                      <View style={styles.vantagemItem}>
                        <ThemedText style={styles.checkIcon}>✓</ThemedText>
                        <ThemedText variant="caption" style={styles.vantagemTexto}>
                          Fechamento de Caixa Cego e Auditoria por Turno
                        </ThemedText>
                      </View>
                      {isPro && (
                        <>
                          <View style={styles.vantagemItem}>
                            <ThemedText style={styles.checkIcon}>⚡</ThemedText>
                            <ThemedText variant="caption" weight="bold" style={styles.vantagemDestaque}>
                              Previsões Preditivas com HistGradientBoosting (IA)
                            </ThemedText>
                          </View>
                          <View style={styles.vantagemItem}>
                            <ThemedText style={styles.checkIcon}>⚡</ThemedText>
                            <ThemedText variant="caption" weight="bold" style={styles.vantagemDestaque}>
                              Alertas Reativos SSE de Estoque Crítico em Tempo Real
                            </ThemedText>
                          </View>
                        </>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Botões de Ação */}
            <View style={styles.acoesContainer}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Confirmar assinatura do plano selecionado"
                disabled={isAssinando || !planoSelecionadoId}
                onPress={() => onConfirmar(planoSelecionadoId)}
                style={({ pressed }) => [
                  styles.botaoAssinar,
                  isAssinando && styles.botaoAssinarDesabilitado,
                  pressed && styles.botaoAssinarPressionado,
                ]}
              >
                {isAssinando ? (
                  <ActivityIndicator color={tokens.colors.white} />
                ) : (
                  <ThemedText variant="subtitle" weight="bold" color={tokens.colors.white}>
                    Assinar {planoAtivo?.nome} (R$ {planoAtivo?.precoMensal.toFixed(2).replace('.', ',')})
                  </ThemedText>
                )}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Continuar no trial"
                disabled={isAssinando}
                onPress={onClose}
                style={styles.botaoVoltar}
              >
                <ThemedText variant="caption" style={styles.textoVoltar}>
                  Continuar usando o período de teste
                </ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: tokens.colors.background,
    borderTopLeftRadius: tokens.radii.lg,
    borderTopRightRadius: tokens.radii.lg,
    maxHeight: '88%',
    paddingBottom: tokens.spacing.xl,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: tokens.colors.border,
    alignSelf: 'center',
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.sm,
  },
  scroll: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
    marginTop: tokens.spacing.xs,
  },
  badgeTopo: {
    backgroundColor: tokens.colors.primaryLight,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: tokens.radii.full,
    marginBottom: tokens.spacing.xs,
  },
  titulo: {
    fontSize: tokens.typography.fontXl,
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
  },
  subtitulo: {
    fontSize: tokens.typography.fontSm,
    color: tokens.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  planosContainer: {
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  cardPlano: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.md,
    borderWidth: 2,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    position: 'relative',
  },
  cardPlanoDestaque: {
    borderColor: '#FFAB91',
  },
  cardPlanoSelecionado: {
    borderColor: tokens.colors.primary,
    backgroundColor: '#FFFDFD',
  },
  tagRecomendado: {
    position: 'absolute',
    top: -12,
    right: 14,
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radii.full,
  },
  cardPlanoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: tokens.colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: tokens.colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: tokens.colors.primary,
  },
  nomePlano: {
    fontSize: tokens.typography.fontMd,
  },
  precoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  precoPeriodo: {
    fontSize: tokens.typography.fontXs,
    color: tokens.colors.textMuted,
  },
  descricaoPlano: {
    color: tokens.colors.textSecondary,
    marginBottom: tokens.spacing.sm,
  },
  vantagensLista: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
    paddingTop: tokens.spacing.sm,
  },
  vantagemItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  checkIcon: {
    fontSize: 13,
    color: tokens.colors.status.greenText,
  },
  vantagemTexto: {
    fontSize: tokens.typography.fontXs,
    color: tokens.colors.textSecondary,
  },
  vantagemDestaque: {
    fontSize: tokens.typography.fontXs,
    color: tokens.colors.primaryDark,
  },
  acoesContainer: {
    gap: tokens.spacing.sm,
  },
  botaoAssinar: {
    backgroundColor: tokens.colors.primary,
    height: 52,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoAssinarDesabilitado: {
    opacity: 0.6,
  },
  botaoAssinarPressionado: {
    backgroundColor: tokens.colors.primaryDark,
  },
  botaoVoltar: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.xs,
  },
  textoVoltar: {
    color: tokens.colors.textMuted,
  },
});
