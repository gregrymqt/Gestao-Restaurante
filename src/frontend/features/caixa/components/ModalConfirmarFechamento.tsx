import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { useConnectionStore } from '@/shared/hooks/useConnectionStore';
import { SessaoCaixaResumo } from '../types';
import { ConferenciaGavetaBox } from './ConferenciaGavetaBox';

interface ModalConfirmarFechamentoProps {
  visible: boolean;
  sessao: SessaoCaixaResumo;
  isPending: boolean;
  onConfirmar: () => void;
  onClose: () => void;
}

export function ModalConfirmarFechamento({
  visible,
  sessao,
  isPending,
  onConfirmar,
  onClose,
}: ModalConfirmarFechamentoProps) {
  const isApiOnline = useConnectionStore((state) => state.isApiOnline);
  // Localiza o valor apurado em dinheiro na gaveta
  const valorDinheiro =
    sessao.pagamentos.find((p) => p.tipo === 'Dinheiro')?.valor || 0;

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancelar fechamento"
          style={styles.backdrop}
          onPress={onClose}
        />

        <View style={styles.bottomSheet}>
          {/* Drag Indicator */}
          <View style={styles.dragIndicator} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header do Modal */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <ThemedText variant="title" style={styles.tituloModal}>
                  Confirmar Fechamento
                </ThemedText>
                <ThemedText variant="caption" style={styles.subtituloModal}>
                  {sessao.turno} • {sessao.terminal}
                </ThemedText>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar modal"
                style={styles.botaoFechar}
                onPress={onClose}
              >
                <ThemedText variant="subtitle" style={styles.textoFechar}>
                  ✕
                </ThemedText>
              </Pressable>
            </View>

            {/* Resumo Consolidado do Turno */}
            <View style={styles.resumoBox}>
              <View style={styles.resumoItem}>
                <ThemedText variant="caption" style={styles.labelResumo}>
                  TOTAL APURADO
                </ThemedText>
                <ThemedText variant="title" style={styles.valorResumoDestaque}>
                  R$ {sessao.totalApurado.toFixed(2).replace('.', ',')}
                </ThemedText>
              </View>

              <View style={styles.resumoDivisor} />

              <View style={styles.resumoItem}>
                <ThemedText variant="caption" style={styles.labelResumo}>
                  VENDAS CONSOLIDADAS
                </ThemedText>
                <ThemedText variant="subtitle" style={styles.valorResumo}>
                  {sessao.totalVendas} transações
                </ThemedText>
              </View>
            </View>

            {/* Subcomponente de Conferência de Gaveta e Aviso RabbitMQ */}
            <ConferenciaGavetaBox valorDinheiro={valorDinheiro} />

            {/* Ações: Cancelar e Confirmar */}
            <View style={styles.acoesContainer}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={!isApiOnline ? 'Servidor offline - fechamento suspenso' : 'Confirmar e fechar caixa'}
                accessibilityState={{ disabled: isPending || !isApiOnline }}
                disabled={isPending || !isApiOnline}
                style={({ pressed }) => [
                  styles.botaoConfirmar,
                  (isPending || !isApiOnline) && styles.botaoConfirmarDesabilitado,
                  pressed && isApiOnline && styles.botaoConfirmarPressionado,
                ]}
                onPress={onConfirmar}
              >
                {isPending ? (
                  <ActivityIndicator color={tokens.colors.white} />
                ) : (
                  <View style={styles.conteudoBotao}>
                    <ThemedText variant="title" style={styles.iconeBotao}>
                      {!isApiOnline ? '📡' : '🔒'}
                    </ThemedText>
                    <ThemedText
                      variant="subtitle"
                      weight="bold"
                      color={tokens.colors.white}
                      style={styles.textoBotao}
                    >
                      {!isApiOnline ? 'Servidor Offline - Fechamento Suspenso' : 'Confirmar Fechamento e Enviar para IA'}
                    </ThemedText>
                  </View>
                )}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancelar e voltar"
                disabled={isPending}
                style={styles.botaoCancelar}
                onPress={onClose}
              >
                <ThemedText variant="subtitle" style={styles.textoCancelar}>
                  Voltar e Manter Caixa Aberto
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: tokens.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.sm,
    paddingBottom: tokens.spacing.xl,
    maxHeight: '90%',
  },
  dragIndicator: {
    width: 44,
    height: 4,
    backgroundColor: '#D9D9D9',
    borderRadius: tokens.radii.full,
    alignSelf: 'center',
    marginBottom: tokens.spacing.md,
  },
  scrollContent: {
    paddingBottom: tokens.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  tituloModal: {
    fontSize: tokens.typography.fontXl,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  subtituloModal: {
    fontSize: tokens.typography.fontXs,
    color: tokens.colors.textMuted,
    marginTop: 2,
  },
  botaoFechar: {
    width: 44,
    height: 44,
    borderRadius: tokens.radii.full,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoFechar: {
    color: tokens.colors.textSecondary,
    fontSize: tokens.typography.fontMd,
    fontWeight: '700',
  },
  resumoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
  },
  resumoItem: {
    flex: 1,
  },
  labelResumo: {
    fontSize: 10,
    fontWeight: '700',
    color: tokens.colors.textMuted,
    letterSpacing: 0.5,
  },
  valorResumoDestaque: {
    fontSize: tokens.typography.fontXl,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
    marginTop: 2,
  },
  valorResumo: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginTop: 2,
  },
  resumoDivisor: {
    width: 1,
    height: 36,
    backgroundColor: tokens.colors.border,
    marginHorizontal: tokens.spacing.md,
  },
  acoesContainer: {
    gap: tokens.spacing.sm,
  },
  botaoConfirmar: {
    height: 54,
    borderRadius: 14,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoConfirmarDesabilitado: {
    opacity: 0.6,
  },
  botaoConfirmarPressionado: {
    backgroundColor: tokens.colors.primaryDark,
    opacity: 0.88,
  },
  conteudoBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  iconeBotao: {
    fontSize: tokens.typography.fontMd,
  },
  textoBotao: {
    fontSize: tokens.typography.fontMd,
  },
  botaoCancelar: {
    height: 48,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoCancelar: {
    fontSize: tokens.typography.fontSm,
    color: tokens.colors.textSecondary,
    fontWeight: '600',
  },
});
