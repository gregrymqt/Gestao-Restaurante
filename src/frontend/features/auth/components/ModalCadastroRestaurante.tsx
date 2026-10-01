import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { AppDialog } from '@/shared/components/AppDialog';
import { useCadastroRestauranteMutation } from '../hooks/useCadastroRestauranteMutation';
import { ModalCadastroUfSelector } from './ModalCadastroUfSelector';
import { mascararCnpj, isCnpjFormatoValido } from '../utils/maskUtils';
import { createShadow } from '@/shared/utils/shadows';

interface ModalCadastroRestauranteProps {
  visible: boolean;
  onClose: () => void;
}

export function ModalCadastroRestaurante({ visible, onClose }: ModalCadastroRestauranteProps) {
  const [nomeRestaurante, setNomeRestaurante] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [cidade, setCidade] = useState('São Paulo');
  const [estado, setEstado] = useState('SP');
  const [nomeGestor, setNomeGestor] = useState('');
  const [emailGestor, setEmailGestor] = useState('');
  const [senhaGestor, setSenhaGestor] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [isUfModalOpen, setIsUfModalOpen] = useState(false);

  const cadastroMutation = useCadastroRestauranteMutation();

  const handleSubmeter = () => {
    if (!nomeRestaurante.trim()) {
      AppDialog.warning('Atenção', 'Informe o nome do seu restaurante.');
      return;
    }
    if (!cnpj.trim() || !isCnpjFormatoValido(cnpj)) {
      AppDialog.warning('Atenção', 'Informe um CNPJ completo com 14 dígitos.');
      return;
    }
    if (!nomeGestor.trim()) {
      AppDialog.warning('Atenção', 'Informe o seu nome completo como proprietário/gestor.');
      return;
    }
    if (!emailGestor.trim() || !emailGestor.includes('@')) {
      AppDialog.warning('Atenção', 'Informe um e-mail válido para acesso.');
      return;
    }
    if (!senhaGestor.trim() || senhaGestor.length < 6) {
      AppDialog.warning('Atenção', 'A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    cadastroMutation.mutate({
      nomeRestaurante: nomeRestaurante.trim(),
      cnpj: cnpj.trim(),
      cidade: cidade.trim(),
      estado: estado.trim(),
      nomeGestor: nomeGestor.trim(),
      emailGestor: emailGestor.trim().toLowerCase(),
      senhaGestor: senhaGestor.trim(),
    });
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.overlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar formulário de cadastro"
            style={styles.backdrop}
            onPress={onClose}
          />

          <View style={styles.sheet}>
            <View style={styles.dragIndicator} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scroll}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.tagTrial}>
                  <ThemedText variant="caption" weight="bold" color="#B25E00">
                    🎉 14 DIAS DE TESTE TOTALMENTE GRÁTIS
                  </ThemedText>
                </View>
                <ThemedText variant="title" style={styles.titulo}>
                  Cadastre seu Restaurante
                </ThemedText>
                <ThemedText variant="body" style={styles.subtitulo}>
                  Sem fidelidade ou cartão. Inicie sua degustação de gestão, controle de estoque e inteligência preditiva.
                </ThemedText>
              </View>

              {/* Formulário */}
              <View style={styles.form}>
                <ThemedText variant="caption" weight="bold" style={styles.labelSecao}>
                  DADOS DO ESTABELECIMENTO
                </ThemedText>

                <View style={styles.inputGroup}>
                  <ThemedText variant="caption" style={styles.label}>
                    Nome da Loja / Restaurante *
                  </ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Burger Prime Artesanal"
                    placeholderTextColor={tokens.colors.textMuted}
                    value={nomeRestaurante}
                    onChangeText={setNomeRestaurante}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText variant="caption" style={styles.label}>
                    CNPJ *
                  </ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="00.000.000/0001-00"
                    placeholderTextColor={tokens.colors.textMuted}
                    value={cnpj}
                    onChangeText={(txt) => setCnpj(mascararCnpj(txt))}
                    keyboardType="numeric"
                    maxLength={18}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 2 }]}>
                    <ThemedText variant="caption" style={styles.label}>
                      Cidade
                    </ThemedText>
                    <TextInput
                      style={styles.input}
                      placeholder="Cidade"
                      placeholderTextColor={tokens.colors.textMuted}
                      value={cidade}
                      onChangeText={setCidade}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <ThemedText variant="caption" style={styles.label}>
                      UF (Estado) *
                    </ThemedText>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.selectUfButton}
                      onPress={() => setIsUfModalOpen(true)}
                    >
                      <ThemedText variant="body" weight="bold" color={tokens.colors.textPrimary}>
                        {estado || 'UF'}
                      </ThemedText>
                      <Ionicons name="chevron-down" size={16} color={tokens.colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>

                <ThemedText variant="caption" weight="bold" style={[styles.labelSecao, { marginTop: tokens.spacing.md }]}>
                  CONTA DO PROPRIETÁRIO / GESTOR
                </ThemedText>

                <View style={styles.inputGroup}>
                  <ThemedText variant="caption" style={styles.label}>
                    Seu Nome Completo *
                  </ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Carlos Albuquerque"
                    placeholderTextColor={tokens.colors.textMuted}
                    value={nomeGestor}
                    onChangeText={setNomeGestor}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText variant="caption" style={styles.label}>
                    E-mail Corporativo *
                  </ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="carlos@seurestaurante.com"
                    placeholderTextColor={tokens.colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={emailGestor}
                    onChangeText={setEmailGestor}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText variant="caption" style={styles.label}>
                    Senha de Acesso (mínimo 6 caracteres) *
                  </ThemedText>
                  <View style={styles.senhaContainer}>
                    <TextInput
                      style={styles.inputSenha}
                      placeholder="••••••••"
                      placeholderTextColor={tokens.colors.textMuted}
                      secureTextEntry={!mostrarSenha}
                      value={senhaGestor}
                      onChangeText={setSenhaGestor}
                    />
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setMostrarSenha((prev) => !prev)}
                      style={styles.eyeButton}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={mostrarSenha ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={tokens.colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Ações */}
              <View style={styles.acoesContainer}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Criar conta e iniciar trial"
                  disabled={cadastroMutation.isPending}
                  onPress={handleSubmeter}
                  style={({ pressed }) => [
                    styles.botaoCriar,
                    cadastroMutation.isPending && styles.botaoCriarDesabilitado,
                    pressed && styles.botaoCriarPressionado,
                  ]}
                >
                  {cadastroMutation.isPending ? (
                    <ActivityIndicator color={tokens.colors.white} />
                  ) : (
                    <ThemedText variant="subtitle" weight="bold" color={tokens.colors.white}>
                      Criar Restaurante &amp; Iniciar 14 Dias Grátis
                    </ThemedText>
                  )}
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cancelar cadastro"
                  disabled={cadastroMutation.isPending}
                  onPress={onClose}
                  style={styles.botaoCancelar}
                >
                  <ThemedText variant="caption" style={styles.textoCancelar}>
                    Já possui conta? Voltar para o Login
                  </ThemedText>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modal Seletor de UF */}
      <ModalCadastroUfSelector
        visible={isUfModalOpen}
        ufSelecionada={estado}
        onSelect={setEstado}
        onClose={() => setIsUfModalOpen(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    backgroundColor: tokens.colors.card,
    borderTopLeftRadius: tokens.radii.lg,
    borderTopRightRadius: tokens.radii.lg,
    maxHeight: '90%',
    paddingBottom: tokens.spacing.xl,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: tokens.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.xs,
  },
  scroll: {
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.sm,
    paddingBottom: tokens.spacing.xxl,
  },
  header: {
    marginBottom: tokens.spacing.md,
  },
  tagTrial: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 4,
    borderRadius: tokens.radii.sm,
    marginBottom: tokens.spacing.xs,
  },
  titulo: {
    fontSize: tokens.typography.fontXl,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: tokens.typography.fontSm,
    color: tokens.colors.textSecondary,
    lineHeight: 20,
  },
  form: {
    marginTop: tokens.spacing.xs,
  },
  labelSecao: {
    color: tokens.colors.primaryDark,
    letterSpacing: 0.5,
    marginBottom: tokens.spacing.sm,
    fontSize: 11,
  },
  inputGroup: {
    marginBottom: tokens.spacing.md,
  },
  label: {
    color: tokens.colors.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.md,
    height: 46,
    fontSize: tokens.typography.fontMd,
    color: tokens.colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  selectUfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.md,
    height: 46,
  },
  senhaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.md,
    height: 46,
  },
  inputSenha: {
    flex: 1,
    fontSize: tokens.typography.fontMd,
    color: tokens.colors.textPrimary,
  },
  eyeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -tokens.spacing.sm,
  },
  acoesContainer: {
    marginTop: tokens.spacing.md,
    gap: tokens.spacing.sm,
  },
  botaoCriar: {
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radii.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({
      color: tokens.colors.primary,
      offsetY: 4,
      radius: 8,
      opacity: 0.3,
      elevation: 3,
    }),
  },
  botaoCriarDesabilitado: {
    opacity: 0.6,
  },
  botaoCriarPressionado: {
    opacity: 0.9,
  },
  botaoCancelar: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.sm,
  },
  textoCancelar: {
    color: tokens.colors.textMuted,
    fontWeight: '600',
  },
});
