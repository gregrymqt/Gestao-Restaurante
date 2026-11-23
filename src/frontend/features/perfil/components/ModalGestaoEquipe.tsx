import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { AppDialog } from '@/shared/components/AppDialog';
import { equipeService, ColaboradorEquipe } from '../services/equipeService';
import { ColaboradorItemCard } from './ColaboradorItemCard';
import { styles } from './ModalGestaoEquipe.styles';

interface ModalGestaoEquipeProps {
  visible: boolean;
  onClose: () => void;
}

export function ModalGestaoEquipe({ visible, onClose }: ModalGestaoEquipeProps) {
  const [abaAtiva, setAbaAtiva] = useState<'lista' | 'novo'>('lista');
  const [colaboradores, setColaboradores] = useState<ColaboradorEquipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Operator' | 'Manager'>('Operator');
  const [pin, setPin] = useState('');

  const carregarEquipe = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await equipeService.listarEquipe();
      setColaboradores(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao listar colaboradores.';
      AppDialog.error('Equipe', msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      carregarEquipe();
      setAbaAtiva('lista');
    }
  }, [visible, carregarEquipe]);

  const handleCadastrar = async () => {
    if (!nome.trim()) {
      AppDialog.warning('Campo Obrigatório', 'Informe o nome do colaborador.');
      return;
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      AppDialog.warning('PIN Inválido', 'O PIN de balcão deve conter exatamente 4 dígitos numéricos.');
      return;
    }

    setIsSubmitting(true);
    try {
      await equipeService.cadastrarOperador({
        nome: nome.trim(),
        email: email.trim() || undefined,
        role,
        pin,
      });

      AppDialog.success('Sucesso', 'Colaborador adicionado à equipe.');
      setNome('');
      setEmail('');
      setPin('');
      setRole('Operator');
      setAbaAtiva('lista');
      await carregarEquipe();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao cadastrar.';
      AppDialog.error('Erro no Cadastro', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAlternarStatus = async (item: ColaboradorEquipe) => {
    try {
      if (item.ativo) {
        await equipeService.desativarOperador(item.id);
        AppDialog.info('Desativado', `Acesso de ${item.nome} foi desativado.`);
      } else {
        await equipeService.ativarOperador(item.id);
        AppDialog.success('Reativado', `Acesso de ${item.nome} foi reativado.`);
      }
      await carregarEquipe();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao alterar status.';
      AppDialog.error('Atenção', msg);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View style={styles.modalContainer}>
            <View style={styles.dragHandle} />

            <View style={styles.header}>
              <View style={styles.headerTitles}>
                <ThemedText variant="title" weight="bold">
                  Gestão da Equipe
                </ThemedText>
                <ThemedText variant="caption" color={tokens.colors.textMuted}>
                  Operadores de Caixa, Atendentes e Gestores
                </ThemedText>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Fechar modal de equipe"
              >
                <Ionicons name="close" size={24} color={tokens.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.sectionTabs} accessibilityRole="tablist">
              <TouchableOpacity
                onPress={() => setAbaAtiva('lista')}
                accessibilityRole="tab"
                accessibilityState={{ selected: abaAtiva === 'lista' }}
                accessibilityLabel={`Aba Colaboradores, ${colaboradores.length} cadastrados`}
                style={[styles.tabButton, abaAtiva === 'lista' && styles.tabButtonActive]}
              >
                <ThemedText
                  variant="caption"
                  weight="bold"
                  color={abaAtiva === 'lista' ? '#FFFFFF' : tokens.colors.textMuted}
                >
                  Colaboradores ({colaboradores.length})
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAbaAtiva('novo')}
                accessibilityRole="tab"
                accessibilityState={{ selected: abaAtiva === 'novo' }}
                accessibilityLabel="Aba Novo Colaborador"
                style={[styles.tabButton, abaAtiva === 'novo' && styles.tabButtonActive]}
              >
                <ThemedText
                  variant="caption"
                  weight="bold"
                  color={abaAtiva === 'novo' ? '#FFFFFF' : tokens.colors.textMuted}
                >
                  + Novo Colaborador
                </ThemedText>
              </TouchableOpacity>
            </View>

            {abaAtiva === 'lista' ? (
              isLoading ? (
                <View style={styles.emptyContainer}>
                  <ActivityIndicator size="large" color={tokens.colors.primary} />
                </View>
              ) : (
                <FlatList
                  data={colaboradores}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 24 }}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <ThemedText variant="body" color={tokens.colors.textMuted}>
                        Nenhum colaborador encontrado nesta unidade.
                      </ThemedText>
                    </View>
                  }
                  renderItem={({ item }) => (
                    <ColaboradorItemCard item={item} onAlternarStatus={handleAlternarStatus} />
                  )}
                />
              )
            ) : (
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <ThemedText variant="caption" weight="bold">
                    Nome Completo *
                  </ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Carlos Oliveira"
                    placeholderTextColor={tokens.colors.textMuted}
                    value={nome}
                    onChangeText={setNome}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText variant="caption" weight="bold">
                    E-mail (opcional)
                  </ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="carlos@restaurante.com"
                    placeholderTextColor={tokens.colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText variant="caption" weight="bold">
                    Cargo / Perfil
                  </ThemedText>
                  <View style={styles.roleSelectorRow}>
                    <TouchableOpacity
                      onPress={() => setRole('Operator')}
                      style={[styles.roleOptionBtn, role === 'Operator' && styles.roleOptionActive]}
                    >
                      <ThemedText
                        variant="caption"
                        weight="bold"
                        color={role === 'Operator' ? tokens.colors.primaryDark : tokens.colors.textPrimary}
                      >
                        Operador de Caixa
                      </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setRole('Manager')}
                      style={[styles.roleOptionBtn, role === 'Manager' && styles.roleOptionActive]}
                    >
                      <ThemedText
                        variant="caption"
                        weight="bold"
                        color={role === 'Manager' ? tokens.colors.primaryDark : tokens.colors.textPrimary}
                      >
                        Gestor / Gerente
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText variant="caption" weight="bold">
                    PIN Numérico de Acesso Rápido (4 Dígitos) *
                  </ThemedText>
                  <TextInput
                    style={[styles.input, styles.pinInput]}
                    placeholder="••••"
                    placeholderTextColor={tokens.colors.textMuted}
                    value={pin}
                    onChangeText={(val) => setPin(val.replace(/\D/g, '').slice(0, 4))}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleCadastrar}
                  disabled={isSubmitting}
                  style={styles.submitButton}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <ThemedText variant="body" weight="bold" color="#FFFFFF">
                      Cadastrar Colaborador
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
