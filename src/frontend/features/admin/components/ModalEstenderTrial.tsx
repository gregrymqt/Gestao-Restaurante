import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { TenantAdminItem } from '../types';

interface ModalEstenderTrialProps {
  visible: boolean;
  tenant: TenantAdminItem | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirmar: (restauranteId: string, dias: number) => void;
}

const OPCOES_ATALHO = [7, 14, 30];

export function ModalEstenderTrial({
  visible,
  tenant,
  isSubmitting,
  onClose,
  onConfirmar,
}: ModalEstenderTrialProps) {
  const [diasSelecionados, setDiasSelecionados] = useState<number>(14);
  const [diasCustomInput, setDiasCustomInput] = useState<string>('14');

  useEffect(() => {
    if (visible) {
      setDiasSelecionados(14);
      setDiasCustomInput('14');
    }
  }, [visible]);

  if (!tenant) return null;

  const handleSelecionarAtalho = (dias: number) => {
    setDiasSelecionados(dias);
    setDiasCustomInput(String(dias));
  };

  const handleAlterarCustom = (texto: string) => {
    const limpo = texto.replace(/\D/g, '');
    setDiasCustomInput(limpo);
    const parsed = parseInt(limpo, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setDiasSelecionados(parsed);
    }
  };

  const handleConfirmar = () => {
    if (diasSelecionados > 0 && !isSubmitting) {
      onConfirmar(tenant.restauranteId, diasSelecionados);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Cabeçalho */}
          <View style={styles.header}>
            <View style={styles.tagIcone}>
              <ThemedText variant="caption" weight="bold" color="#B25E00">
                ⏳ DEGUSTAÇÃO TRIAL
              </ThemedText>
            </View>
            <ThemedText variant="subtitle" weight="bold" style={styles.titulo}>
              Estender Período de Teste
            </ThemedText>
            <ThemedText variant="caption" style={styles.subtitulo} numberOfLines={2}>
              Restaurante: <ThemedText variant="caption" weight="bold">{tenant.nomeRestaurante}</ThemedText>
            </ThemedText>
          </View>

          {/* Atalhos Rápidos */}
          <ThemedText variant="caption" weight="bold" style={styles.labelSecao}>
            SELECIONE O PRAZO ADICIONAL:
          </ThemedText>
          <View style={styles.atalhosRow}>
            {OPCOES_ATALHO.map((dias) => {
              const isAtivo = diasSelecionados === dias;
              return (
                <Pressable
                  key={dias}
                  accessibilityRole="button"
                  accessibilityLabel={`Adicionar ${dias} dias`}
                  disabled={isSubmitting}
                  onPress={() => handleSelecionarAtalho(dias)}
                  style={({ pressed }) => [
                    styles.chipAtalho,
                    isAtivo && styles.chipAtalhoAtivo,
                    pressed && styles.pressed,
                  ]}
                >
                  <ThemedText
                    variant="caption"
                    weight="bold"
                    color={isAtivo ? tokens.colors.white : '#B25E00'}
                  >
                    +{dias} dias
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Campo Numérico Customizado */}
          <View style={styles.inputCustomContainer}>
            <ThemedText variant="caption" style={styles.labelInput}>
              Ou digite a quantidade de dias:
            </ThemedText>
            <TextInput
              style={styles.inputDias}
              keyboardType="numeric"
              maxLength={3}
              value={diasCustomInput}
              onChangeText={handleAlterarCustom}
              editable={!isSubmitting}
              placeholder="Ex: 21"
              placeholderTextColor={tokens.colors.textMuted}
            />
          </View>

          {/* Rodapé com Ações */}
          <View style={styles.botoesRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancelar extensão"
              disabled={isSubmitting}
              onPress={onClose}
              style={({ pressed }) => [styles.botaoCancelar, pressed && styles.pressed]}
            >
              <ThemedText variant="caption" weight="bold" color={tokens.colors.textMuted}>
                Cancelar
              </ThemedText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirmar extensão de degustação"
              disabled={isSubmitting || diasSelecionados <= 0}
              onPress={handleConfirmar}
              style={({ pressed }) => [
                styles.botaoConfirmar,
                (isSubmitting || diasSelecionados <= 0) && styles.botaoDesabilitado,
                pressed && styles.pressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={tokens.colors.white} />
              ) : (
                <ThemedText variant="caption" weight="bold" color={tokens.colors.white}>
                  Confirmar (+{diasSelecionados}d)
                </ThemedText>
              )}
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.md,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
  },
  header: {
    marginBottom: tokens.spacing.md,
  },
  tagIcone: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: tokens.radii.sm,
    marginBottom: 6,
  },
  titulo: {
    fontSize: 18,
    marginBottom: 4,
  },
  subtitulo: {
    color: tokens.colors.textMuted,
  },
  labelSecao: {
    color: tokens.colors.textMuted,
    fontSize: 11,
    marginBottom: tokens.spacing.sm,
  },
  atalhosRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  chipAtalho: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: tokens.radii.sm,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  chipAtalhoAtivo: {
    backgroundColor: '#B25E00',
    borderColor: '#B25E00',
  },
  inputCustomContainer: {
    marginBottom: tokens.spacing.lg,
  },
  labelInput: {
    color: tokens.colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
  },
  inputDias: {
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: tokens.colors.textPrimary,
  },
  botoesRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: tokens.spacing.sm,
  },
  botaoCancelar: {
    paddingVertical: 10,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radii.sm,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoConfirmar: {
    backgroundColor: '#B25E00',
    paddingVertical: 10,
    paddingHorizontal: tokens.spacing.lg,
    borderRadius: tokens.radii.sm,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoDesabilitado: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});
