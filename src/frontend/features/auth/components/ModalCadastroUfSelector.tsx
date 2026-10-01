import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { ESTADOS_BRASIL, EstadoUf } from '../utils/estadosBrasil';

interface ModalCadastroUfSelectorProps {
  visible: boolean;
  ufSelecionada: string;
  onSelect: (uf: string) => void;
  onClose: () => void;
}

export function ModalCadastroUfSelector({
  visible,
  ufSelecionada,
  onSelect,
  onClose,
}: ModalCadastroUfSelectorProps) {
  const [busca, setBusca] = useState('');

  const estadosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return ESTADOS_BRASIL;
    return ESTADOS_BRASIL.filter(
      (e) =>
        e.sigla.toLowerCase().includes(termo) ||
        e.nome.toLowerCase().includes(termo)
    );
  }, [busca]);

  const handleSelect = (sigla: string) => {
    onSelect(sigla);
    setBusca('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar seleção de estado"
          style={styles.backdrop}
          onPress={() => {
            setBusca('');
            onClose();
          }}
        />

        <View style={styles.sheet}>
          <View style={styles.dragIndicator} />

          <View style={styles.header}>
            <ThemedText variant="subtitle" weight="bold" style={styles.title}>
              Selecione o Estado (UF)
            </ThemedText>
            <ThemedText variant="caption" color={tokens.colors.textMuted}>
              Escolha a unidade federativa do seu estabelecimento
            </ThemedText>
          </View>

          {/* Barra de Pesquisa */}
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={tokens.colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por estado ou sigla..."
              placeholderTextColor={tokens.colors.textMuted}
              value={busca}
              onChangeText={setBusca}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {busca.length > 0 && (
              <TouchableOpacity
                onPress={() => setBusca('')}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close-circle" size={18} color={tokens.colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Lista de UFs */}
          <ScrollView
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {estadosFiltrados.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ThemedText variant="caption" color={tokens.colors.textMuted}>
                  Nenhum estado encontrado para "{busca}".
                </ThemedText>
              </View>
            ) : (
              estadosFiltrados.map((uf: EstadoUf) => {
                const isSelected = uf.sigla === ufSelecionada;
                return (
                  <TouchableOpacity
                    key={uf.sigla}
                    activeOpacity={0.7}
                    onPress={() => handleSelect(uf.sigla)}
                    style={[styles.item, isSelected && styles.itemSelected]}
                  >
                    <View style={styles.siglaBadge}>
                      <ThemedText variant="caption" weight="bold" color={tokens.colors.primary}>
                        {uf.sigla}
                      </ThemedText>
                    </View>
                    <ThemedText variant="body" style={styles.nomeEstado}>
                      {uf.nome}
                    </ThemedText>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={tokens.colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    backgroundColor: tokens.colors.card,
    borderTopLeftRadius: tokens.radii.lg,
    borderTopRightRadius: tokens.radii.lg,
    paddingTop: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxl,
    maxHeight: '75%',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: tokens.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: tokens.spacing.md,
  },
  header: {
    marginBottom: tokens.spacing.md,
  },
  title: {
    fontSize: tokens.typography.fontLg,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.md,
    height: 44,
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: tokens.typography.fontSm,
    color: tokens.colors.textPrimary,
  },
  list: {
    maxHeight: 340,
  },
  emptyContainer: {
    paddingVertical: tokens.spacing.xl,
    alignItems: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
    gap: tokens.spacing.md,
  },
  itemSelected: {
    backgroundColor: tokens.colors.primaryLight,
    borderRadius: tokens.radii.sm,
    paddingHorizontal: tokens.spacing.sm,
  },
  siglaBadge: {
    width: 38,
    height: 28,
    borderRadius: tokens.radii.sm,
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nomeEstado: {
    flex: 1,
    fontSize: tokens.typography.fontMd,
    color: tokens.colors.textPrimary,
  },
});
