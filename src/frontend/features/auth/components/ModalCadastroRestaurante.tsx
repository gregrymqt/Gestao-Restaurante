import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { AppDialog } from '@/shared/components/AppDialog';
import { useCadastroRestauranteMutation } from '../hooks/useCadastroRestauranteMutation';

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

  const cadastroMutation = useCadastroRestauranteMutation();

  const handleSubmeter = () => {
    if (!nomeRestaurante.trim()) {
      AppDialog.warning('Atenção', 'Informe o nome do seu restaurante.');
      return;
    }
    if (!cnpj.trim()) {
      AppDialog.warning('Atenção', 'Informe o CNPJ ou identificador da empresa.');
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
      AppDialog.warning('Atenção', 'A senha deve conter no mínimo 6 dígitos.');
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
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar formulário de cadastro"
          style={styles.backdrop}
          onPress={onClose}
        />

        <View style={styles.sheet}>
          <View style={styles.dragIndicator} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.tagTrial}>
                <ThemedText variant="caption" weight="bold" color="#B25E00">
                  🎉 14 DIAS DE TESTE TOTALMENTE GRÁTIS
                </ThemedText>
              </View>
              <ThemedText variant="title" style={styles.titulo}>
                Cadastre o seu Restaurante
              </ThemedText>
              <ThemedText variant="body" style={styles.subtitulo}>
                Sem necessidade de cartão de crédito. Crie seu inquilino e comece a gerenciar seu estoque e faturamento agora mesmo.
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
                  CNPJ / Documento *
                </ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="00.000.000/0001-00"
                  placeholderTextColor={tokens.colors.textMuted}
                  value={cnpj}
                  onChangeText={setCnpj}
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
                    UF
                  </ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="SP"
                    placeholderTextColor={tokens.colors.textMuted}
                    value={estado}
                    onChangeText={setEstado}
                    maxLength={2}
                    autoCapitalize="characters"
                  />
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
                  E-mail Profissional *
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
                  Senha de Acesso (mínimo 6 dígitos) *
                </ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={tokens.colors.textMuted}
                  secureTextEntry
                  value={senhaGestor}
                  onChangeText={setSenhaGestor}
                />
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
                    🚀 Criar Restaurante & Ativar 14 Dias Grátis
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: tokens.colors.background,
    borderTopLeftRadius: tokens.radii.lg,
    borderTopRightRadius: tokens.radii.lg,
    maxHeight: '92%',
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
    marginBottom: tokens.spacing.md,
    marginTop: tokens.spacing.xs,
  },
  tagTrial: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE082',
    borderWidth: 1,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: 4,
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
  form: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  labelSecao: {
    color: tokens.colors.primary,
    letterSpacing: 0.8,
    marginBottom: tokens.spacing.sm,
  },
  inputGroup: {
    marginBottom: tokens.spacing.sm,
  },
  label: {
    marginBottom: 4,
    color: tokens.colors.textSecondary,
  },
  input: {
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    fontSize: tokens.typography.fontMd,
    color: tokens.colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  acoesContainer: {
    gap: tokens.spacing.sm,
  },
  botaoCriar: {
    backgroundColor: tokens.colors.primary,
    height: 52,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoCriarDesabilitado: {
    opacity: 0.6,
  },
  botaoCriarPressionado: {
    backgroundColor: tokens.colors.primaryDark,
  },
  botaoCancelar: {
    alignItems: 'center',
    paddingVertical: tokens.spacing.xs,
  },
  textoCancelar: {
    color: tokens.colors.textMuted,
  },
});
