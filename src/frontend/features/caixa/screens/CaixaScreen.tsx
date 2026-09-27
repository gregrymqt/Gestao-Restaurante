import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { useCaixaAtual } from '../hooks/useCaixaAtual';
import { useFecharCaixa } from '../hooks/useFecharCaixa';
import { ContextoOperacionalHeader } from '../components/ContextoOperacionalHeader';
import { CardFaturamentoTotal } from '../components/CardFaturamentoTotal';
import { DistribuicaoPagamentos } from '../components/DistribuicaoPagamentos';
import { WidgetClimaSessao } from '../components/WidgetClimaSessao';
import { ModalConfirmarFechamento } from '../components/ModalConfirmarFechamento';

export function CaixaScreen() {
  const [isModalVisivel, setIsModalVisivel] = useState(false);
  const { sessao, isLoading, refetch } = useCaixaAtual();

  const { mutate: dispararFechamento, isPending } = useFecharCaixa({
    onSuccessCallback: () => {
      setIsModalVisivel(false);
    },
  });

  const handleConfirmarFechamento = () => {
    dispararFechamento();
  };

  const isCaixaAberto = sessao.status === 'Aberta';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header Fixo de Contexto Operacional */}
        <ContextoOperacionalHeader
          status={sessao.status}
          terminal={sessao.terminal}
          dataHora={sessao.dataHoraFormatada}
          turno={sessao.turno}
          operador={sessao.operador}
        />

        {/* Conteúdo com Rolagem Vertical */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              colors={[tokens.colors.primary]}
              tintColor={tokens.colors.primary}
            />
          }
        >
          {/* Card 1: Faturamento Consolidado */}
          <CardFaturamentoTotal
            totalApurado={sessao.totalApurado}
            percentualMeta={sessao.percentualMeta}
            totalVendas={sessao.totalVendas}
            ticketMedio={sessao.ticketMedio}
          />

          {/* Card 2: Distribuição dos 4 Métodos de Pagamento */}
          <DistribuicaoPagamentos pagamentos={sessao.pagamentos} />

          {/* Card 3: Contexto Climático da Sessão */}
          <WidgetClimaSessao clima={sessao.clima} />

          {/* Botão de Encerramento do Caixa */}
          <View style={styles.acaoRodapeContainer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Encerrar sessão e fechar caixa"
              accessibilityState={{ disabled: !isCaixaAberto }}
              disabled={!isCaixaAberto}
              style={({ pressed }) => [
                styles.botaoEncerrar,
                !isCaixaAberto && styles.botaoEncerrarDesabilitado,
                pressed && isCaixaAberto && styles.botaoEncerrarPressionado,
              ]}
              onPress={() => setIsModalVisivel(true)}
            >
              <View style={styles.conteudoBotao}>
                <ThemedText variant="title" style={styles.iconeBotao}>
                  🔄
                </ThemedText>
                <ThemedText
                  variant="subtitle"
                  weight="bold"
                  color={tokens.colors.white}
                  style={styles.textoBotao}
                >
                  {isCaixaAberto
                    ? 'Encerrar Sessão e Fechar Caixa'
                    : 'Caixa do Turno Encerrado'}
                </ThemedText>
              </View>
            </Pressable>

            <ThemedText variant="caption" style={styles.microcopiaRodape}>
              O encerramento consolida o histórico de vendas e dispara o
              processamento preditivo de inteligência artificial.
            </ThemedText>
          </View>
        </ScrollView>

        {/* Modal Seguro de Confirmação com Dupla Etapa */}
        <ModalConfirmarFechamento
          visible={isModalVisivel}
          sessao={sessao}
          isPending={isPending}
          onConfirmar={handleConfirmarFechamento}
          onClose={() => setIsModalVisivel(false)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: tokens.colors.card,
  },
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  scrollContent: {
    paddingBottom: tokens.spacing.xxl,
  },
  acaoRodapeContainer: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
  },
  botaoEncerrar: {
    height: 54,
    borderRadius: 14,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.sm,
  },
  botaoEncerrarDesabilitado: {
    backgroundColor: tokens.colors.textMuted,
    opacity: 0.6,
  },
  botaoEncerrarPressionado: {
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
  microcopiaRodape: {
    textAlign: 'center',
    color: tokens.colors.textMuted,
    fontSize: tokens.typography.fontXs,
    lineHeight: 16,
    paddingHorizontal: tokens.spacing.md,
  },
});
