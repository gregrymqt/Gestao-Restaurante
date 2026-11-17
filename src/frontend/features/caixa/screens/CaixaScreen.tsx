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
import { useAbrirCaixa, useCaixaAtual } from '../hooks/useCaixaAtual';
import { useFecharCaixa } from '../hooks/useFecharCaixa';
import { ContextoOperacionalHeader } from '../components/ContextoOperacionalHeader';
import { useRouter } from 'expo-router';
import { CardFaturamentoTotal } from '../components/CardFaturamentoTotal';
import { DistribuicaoPagamentos } from '../components/DistribuicaoPagamentos';
import { WidgetClimaSessao } from '../components/WidgetClimaSessao';
import { ModalConfirmarFechamento } from '../components/ModalConfirmarFechamento';

export function CaixaScreen() {
  const router = useRouter();
  const [isModalVisivel, setIsModalVisivel] = useState(false);
  const { sessao, isLoading, refetch } = useCaixaAtual();
  const { mutate: dispararAbertura, isPending: isAbrindo } = useAbrirCaixa();

  const { mutate: dispararFechamento, isPending } = useFecharCaixa({
    onSuccessCallback: () => {
      setIsModalVisivel(false);
    },
  });

  const handleConfirmarFechamento = () => {
    dispararFechamento();
  };

  const isCaixaAberto = sessao.status === 'Aberta';
  const acaoDesabilitada = isLoading || isAbrindo || isPending;
  const textoAcao = isAbrindo
    ? 'Abrindo caixa…'
    : isCaixaAberto ? 'Encerrar Sessão e Fechar Caixa' : 'Abrir Caixa';

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
          onPressVoltar={() => router.push('/(tabs)')}
        />

        {/* Conteúdo com Rolagem Vertical */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => { void refetch(); }}
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

          <View style={styles.acaoRodapeContainer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={textoAcao}
              accessibilityState={{ disabled: acaoDesabilitada, busy: isAbrindo || isPending }}
              disabled={acaoDesabilitada}
              style={({ pressed }) => [
                styles.botaoEncerrar,
                acaoDesabilitada && styles.botaoEncerrarDesabilitado,
                pressed && !acaoDesabilitada && styles.botaoEncerrarPressionado,
              ]}
              onPress={() => {
                if (isCaixaAberto) setIsModalVisivel(true);
                else dispararAbertura();
              }}
            >
              <ThemedText
                variant="subtitle"
                weight="bold"
                color={tokens.colors.white}
                style={styles.textoBotao}
              >
                {textoAcao}
              </ThemedText>
            </Pressable>

            {isCaixaAberto && (
              <ThemedText variant="caption" style={styles.microcopiaRodape}>
                O encerramento consolida o histórico de vendas e dispara o
                processamento preditivo de inteligência artificial.
              </ThemedText>
            )}
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
