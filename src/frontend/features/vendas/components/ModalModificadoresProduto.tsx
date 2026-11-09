import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@/components/primitives/tokens';
import { ThemedText } from '@/components/primitives/ThemedText';
import { shadows } from '@/shared/utils/shadows';
import {
  Produto,
  GrupoModificador,
  OpcaoModificador,
  ModificadorSelecionado,
} from '../types';
import { useModificadoresProduto } from '../hooks/useModificadoresProduto';

interface ModalModificadoresProdutoProps {
  produto: Produto | null;
  visible: boolean;
  onClose: () => void;
  onConfirmar: (modificadores: ModificadorSelecionado[]) => void;
}

export function ModalModificadoresProduto({
  produto,
  visible,
  onClose,
  onConfirmar,
}: ModalModificadoresProdutoProps) {
  const insets = useSafeAreaInsets();
  const paddingInferior = Math.max(insets.bottom, 24) + (Platform.OS === 'web' ? 16 : 0);

  const { data: grupos = [], isLoading } = useModificadoresProduto(produto?.id);

  // Armazena as opções selecionadas agrupadas por grupoId
  const [selecoes, setSelecoes] = useState<Record<string, OpcaoModificador[]>>({});

  // Reset e inicialização com primeira opção padrão para grupos obrigatórios de escolha única
  useEffect(() => {
    if (visible && grupos.length > 0) {
      const inicial: Record<string, OpcaoModificador[]> = {};
      grupos.forEach((grupo) => {
        if (grupo.obrigatorio && grupo.minimoSelecoes === 1 && grupo.maximoSelecoes === 1) {
          if (grupo.opcoes.length > 0) {
            inicial[grupo.id] = [grupo.opcoes[0]]; // Seleciona primeiro por conveniência
          }
        } else {
          inicial[grupo.id] = [];
        }
      });
      setSelecoes(inicial);
    } else if (!visible) {
      setSelecoes({});
    }
  }, [visible, grupos]);

  // Alterna a seleção de uma opção no grupo
  const handleToggleOpcao = (grupo: GrupoModificador, opcao: OpcaoModificador) => {
    setSelecoes((prev) => {
      const atuais = prev[grupo.id] || [];
      const isJaSelecionada = atuais.some((o) => o.id === opcao.id);

      // Escolha única (ex: Ponto da carne)
      if (grupo.maximoSelecoes === 1) {
        if (isJaSelecionada && !grupo.obrigatorio) {
          return { ...prev, [grupo.id]: [] };
        }
        return { ...prev, [grupo.id]: [opcao] };
      }

      // Escolha múltipla (ex: Remoções ou Adicionais)
      if (isJaSelecionada) {
        return { ...prev, [grupo.id]: atuais.filter((o) => o.id !== opcao.id) };
      }

      if (atuais.length >= grupo.maximoSelecoes) {
        return prev; // Atingiu teto máximo do grupo
      }

      return { ...prev, [grupo.id]: [...atuais, opcao] };
    });
  };

  // Validação: todos os grupos obrigatórios devem satisfazer o mínimo de seleções
  const isValido = useMemo(() => {
    if (!grupos || grupos.length === 0) return true;
    for (const grupo of grupos) {
      const qtdSelecionada = (selecoes[grupo.id] || []).length;
      if (grupo.obrigatorio && qtdSelecionada < grupo.minimoSelecoes) {
        return false;
      }
    }
    return true;
  }, [grupos, selecoes]);

  // Preço total recalculado (Preço base do produto + soma dos adicionais)
  const precoTotal = useMemo(() => {
    if (!produto) return 0;
    let total = produto.preco;
    Object.values(selecoes).forEach((opcoesDoGrupo) => {
      opcoesDoGrupo.forEach((op) => {
        total += Number(op.precoAdicional) || 0;
      });
    });
    return Number(total.toFixed(2));
  }, [produto, selecoes]);

  const handleConfirmar = () => {
    if (!isValido) return;

    const listaFinal: ModificadorSelecionado[] = [];
    grupos.forEach((grupo) => {
      const opcoes = selecoes[grupo.id] || [];
      opcoes.forEach((op) => {
        listaFinal.push({
          opcaoId: op.id,
          grupoId: grupo.id,
          nome: op.nome,
          precoAdicional: Number(op.precoAdicional) || 0,
          insumoId: op.insumoId || null,
          quantidadeInsumo: Number(op.quantidadeInsumo) || 0,
          tipoAcao: op.tipoAcao,
        });
      });
    });

    onConfirmar(listaFinal);
  };

  if (!produto) return null;

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar modal de modificadores"
          style={styles.backdrop}
          onPress={onClose}
        />

        <View style={[styles.bottomSheet, { paddingBottom: paddingInferior }]}>
          <View style={styles.dragIndicator} />

          {/* Header do Produto */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <ThemedText variant="title" style={styles.tituloProduto}>
                Personalizar Pedido
              </ThemedText>
              <ThemedText variant="body" weight="medium" style={styles.subtituloProduto}>
                {produto.nome}
              </ThemedText>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.botaoFechar}
              onPress={onClose}
            >
              <ThemedText variant="subtitle" style={styles.textoFechar}>
                ✕
              </ThemedText>
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={tokens.colors.primary} />
              <ThemedText variant="caption" style={styles.loadingTexto}>
                Carregando opções da cozinha...
              </ThemedText>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {grupos.map((grupo) => {
                const selecionadosNoGrupo = selecoes[grupo.id] || [];
                const atendeMinimo =
                  !grupo.obrigatorio || selecionadosNoGrupo.length >= grupo.minimoSelecoes;

                return (
                  <View key={grupo.id} style={styles.grupoContainer}>
                    <View style={styles.grupoHeader}>
                      <View style={styles.grupoTituloRow}>
                        <ThemedText variant="subtitle" weight="bold" style={styles.grupoNome}>
                          {grupo.nome}
                        </ThemedText>
                        <View
                          style={[
                            styles.badgeRegra,
                            grupo.obrigatorio && !atendeMinimo
                              ? styles.badgeObrigatorioPendente
                              : styles.badgeRegraAtendida,
                          ]}
                        >
                          <ThemedText
                            variant="caption"
                            weight="bold"
                            style={[
                              styles.badgeRegraTexto,
                              grupo.obrigatorio && !atendeMinimo
                                ? styles.badgeObrigatorioPendenteTexto
                                : styles.badgeRegraAtendidaTexto,
                            ]}
                          >
                            {grupo.obrigatorio
                              ? `Obrigatório (${selecionadosNoGrupo.length}/${grupo.minimoSelecoes})`
                              : `Opcional (máx ${grupo.maximoSelecoes})`}
                          </ThemedText>
                        </View>
                      </View>

                      {grupo.descricao ? (
                        <ThemedText variant="caption" style={styles.grupoDescricao}>
                          {grupo.descricao}
                        </ThemedText>
                      ) : null}
                    </View>

                    {/* Chips de Seleção Rápida Zero-Typing */}
                    <View style={styles.chipsContainer}>
                      {grupo.opcoes.map((opcao) => {
                        const isSelecionada = selecionadosNoGrupo.some((o) => o.id === opcao.id);
                        const temPreco = Number(opcao.precoAdicional) > 0;

                        return (
                          <Pressable
                            key={opcao.id}
                            accessibilityRole="button"
                            accessibilityState={{ selected: isSelecionada }}
                            accessibilityLabel={`${opcao.nome}${
                              temPreco
                                ? `, adicional de R$ ${Number(opcao.precoAdicional)
                                    .toFixed(2)
                                    .replace('.', ',')}`
                                : ''
                            }`}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={({ pressed }) => [
                              styles.chip,
                              isSelecionada && styles.chipSelecionado,
                              pressed && styles.chipPressionado,
                            ]}
                            onPress={() => handleToggleOpcao(grupo, opcao)}
                          >
                            <View style={styles.chipConteudo}>
                              <ThemedText
                                variant="caption"
                                weight={isSelecionada ? 'bold' : 'normal'}
                                style={[
                                  styles.chipTexto,
                                  isSelecionada && styles.chipTextoSelecionado,
                                ]}
                              >
                                {isSelecionada ? '✓ ' : ''}
                                {opcao.nome}
                              </ThemedText>

                              {temPreco && (
                                <ThemedText
                                  variant="caption"
                                  weight="bold"
                                  style={[
                                    styles.chipPreco,
                                    isSelecionada && styles.chipPrecoSelecionado,
                                  ]}
                                >
                                  + R$ {Number(opcao.precoAdicional).toFixed(2).replace('.', ',')}
                                </ThemedText>
                              )}
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Botão de Adição com Preço Recalculado */}
          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Adicionar ao pedido pelo valor de R$ ${precoTotal
                .toFixed(2)
                .replace('.', ',')}`}
              accessibilityState={{ disabled: !isValido || isLoading }}
              disabled={!isValido || isLoading}
              hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
              style={({ pressed }) => [
                styles.botaoAdicionar,
                (!isValido || isLoading) && styles.botaoAdicionarDesabilitado,
                pressed && isValido && styles.botaoAdicionarPressionado,
              ]}
              onPress={handleConfirmar}
            >
              <ThemedText
                variant="subtitle"
                weight="bold"
                color={tokens.colors.white}
                style={styles.textoBotaoAdicionar}
              >
                {!isValido
                  ? 'Selecione as opções obrigatórias'
                  : `Adicionar ao Pedido • R$ ${precoTotal.toFixed(2).replace('.', ',')}`}
              </ThemedText>
            </Pressable>
          </View>
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
    borderTopLeftRadius: tokens.radii.lg,
    borderTopRightRadius: tokens.radii.lg,
    maxHeight: '85%',
    ...shadows.lg,
  },
  dragIndicator: {
    width: 48,
    height: 5,
    backgroundColor: tokens.colors.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  headerInfo: {
    flex: 1,
  },
  tituloProduto: {
    fontSize: 18,
    color: tokens.colors.textPrimary,
  },
  subtituloProduto: {
    fontSize: 14,
    color: tokens.colors.primary,
    marginTop: 2,
  },
  botaoFechar: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: tokens.colors.background,
  },
  textoFechar: {
    fontSize: 16,
    color: tokens.colors.textMuted,
  },
  loadingContainer: {
    paddingVertical: tokens.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.sm,
  },
  loadingTexto: {
    color: tokens.colors.textMuted,
  },
  scrollContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    gap: tokens.spacing.lg,
  },
  grupoContainer: {
    gap: tokens.spacing.sm,
  },
  grupoHeader: {
    gap: 4,
  },
  grupoTituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grupoNome: {
    fontSize: 15,
    color: tokens.colors.textPrimary,
  },
  grupoDescricao: {
    color: tokens.colors.textMuted,
  },
  badgeRegra: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radii.sm,
  },
  badgeRegraTexto: {
    fontSize: 11,
  },
  badgeRegraAtendida: {
    backgroundColor: tokens.colors.background,
  },
  badgeRegraAtendidaTexto: {
    color: tokens.colors.textSecondary,
    fontSize: 11,
  },
  badgeObrigatorioPendente: {
    backgroundColor: '#FEE2E2',
  },
  badgeObrigatorioPendenteTexto: {
    color: '#DC2626',
    fontSize: 11,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  chip: {
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radii.md,
    backgroundColor: tokens.colors.background,
    borderWidth: 1.5,
    borderColor: tokens.colors.border,
    minHeight: 48,
    justifyContent: 'center',
  },
  chipSelecionado: {
    backgroundColor: '#FFF7ED',
    borderColor: tokens.colors.primary,
  },
  chipPressionado: {
    opacity: 0.8,
  },
  chipConteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  chipTexto: {
    color: tokens.colors.textSecondary,
    fontSize: 13,
  },
  chipTextoSelecionado: {
    color: tokens.colors.primary,
  },
  chipPreco: {
    color: tokens.colors.textMuted,
    fontSize: 12,
  },
  chipPrecoSelecionado: {
    color: tokens.colors.primary,
  },
  footer: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
  botaoAdicionar: {
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radii.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoAdicionarDesabilitado: {
    backgroundColor: tokens.colors.border,
    opacity: 0.7,
  },
  botaoAdicionarPressionado: {
    opacity: 0.9,
  },
  textoBotaoAdicionar: {
    fontSize: 16,
  },
});
