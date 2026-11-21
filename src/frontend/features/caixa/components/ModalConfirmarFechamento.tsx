import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { X, Lock, WifiOff } from 'lucide-react-native';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { useConnectionStore } from '@/shared/hooks/useConnectionStore';
import { SessaoCaixaResumo } from '../types';
import { ConferenciaGavetaBox } from './ConferenciaGavetaBox';
import { ResumoTurnoConsolidado } from './ResumoTurnoConsolidado';

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
  const totalApuradoFormatado = sessao.totalApurado.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      statusBarTranslucent
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
                <X size={18} color={tokens.colors.textMuted} />
              </Pressable>
            </View>

            {/* Resumo Consolidado do Turno */}
            <ResumoTurnoConsolidado
              totalApuradoFormatado={totalApuradoFormatado}
              totalVendas={sessao.totalVendas}
            />

            {/* Subcomponente de Conferência de Gaveta e Aviso RabbitMQ */}
            <ConferenciaGavetaBox valorDinheiro={valorDinheiro} />

            {/* Ações: Cancelar e Confirmar */}
            <View style={styles.acoesContainer}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={!isApiOnline ? 'Conexão necessária para encerrar' : 'Confirmar encerramento do turno'}
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
                    {!isApiOnline ? (
                      <WifiOff size={18} color={tokens.colors.white} />
                    ) : (
                      <Lock size={18} color={tokens.colors.white} />
                    )}
                    <ThemedText
                      variant="subtitle"
                      weight="bold"
                      color={tokens.colors.white}
                      style={styles.textoBotao}
                    >
                      {!isApiOnline ? 'Conexão necessária para encerrar' : 'Confirmar Encerramento do Turno'}
                    </ThemedText>
                  </View>
                )}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Voltar e manter caixa aberto"
                disabled={isPending}
                style={({ pressed }) => [
                  styles.botaoCancelar,
                  pressed && styles.botaoCancelarPressionado,
                ]}
                onPress={onClose}
              >
                <ThemedText style={styles.textoCancelar}>
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
    ...(Platform.OS === 'web'
      ? {
          position: 'fixed' as any,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
        }
      : {}),
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
    minHeight: 44,
    width: '100%',
    borderRadius: tokens.radii.md,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: tokens.spacing.xs,
  },
  botaoCancelarPressionado: {
    backgroundColor: '#E5E7EB',
  },
  textoCancelar: {
    fontSize: tokens.typography.fontSm,
    color: tokens.colors.textPrimary,
    fontWeight: '700',
  },
});
