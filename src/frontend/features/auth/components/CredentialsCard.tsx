import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { shadows } from '@/shared/utils/shadows';
import { AppDialog } from '@/shared/components/AppDialog';

interface CredentialsCardProps {
  identificador: string;
  onIdentificadorChange: (texto: string) => void;
  palavraPasse: string;
  onPalavraPasseChange: (texto: string) => void;
}

export function CredentialsCard({
  identificador,
  onIdentificadorChange,
  palavraPasse,
  onPalavraPasseChange,
}: CredentialsCardProps) {
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const isIdentificadorPreenchido = identificador.trim().length > 0;
  const isSenhaValida = palavraPasse.length >= 6;

  return (
    <View style={styles.card}>
      {/* Header do Card */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons name="lock-closed-outline" size={18} color={tokens.colors.primary} />
          <ThemedText variant="body" weight="bold" style={styles.headerTitle}>
            Credenciais do Gestor
          </ThemedText>
        </View>

        <ThemedText variant="caption" color={tokens.colors.textMuted}>
          Acesso Seguro
        </ThemedText>
      </View>

      {/* Campo 1: Identificador / E-mail */}
      <View style={styles.fieldGroup}>
        <ThemedText variant="caption" style={styles.inputLabel}>
          E-mail Corporativo ou Usuário
        </ThemedText>

        <View style={styles.inputBox}>
          <Ionicons name="mail-outline" size={18} color={tokens.colors.textMuted} />
          <TextInput
            style={styles.textInput}
            placeholder="gestor@restaurante.com"
            placeholderTextColor={tokens.colors.textMuted}
            value={identificador}
            onChangeText={onIdentificadorChange}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          {isIdentificadorPreenchido && (
            <Ionicons name="checkmark-circle" size={18} color={tokens.colors.status.greenText} />
          )}
        </View>
      </View>

      {/* Campo 2: Senha */}
      <View style={styles.fieldGroup}>
        <ThemedText variant="caption" style={styles.inputLabel}>
          Senha de Acesso
        </ThemedText>

        <View style={styles.inputBox}>
          <Ionicons name="key-outline" size={18} color={tokens.colors.textMuted} />
          <TextInput
            style={styles.textInput}
            placeholder="Sua senha de acesso"
            placeholderTextColor={tokens.colors.textMuted}
            secureTextEntry={!mostrarSenha}
            value={palavraPasse}
            onChangeText={onPalavraPasseChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setMostrarSenha((prev) => !prev)}
            style={styles.eyeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
          >
            <Ionicons
              name={mostrarSenha ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={tokens.colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Linha de Suporte e Recuperação */}
        <View style={styles.supportRow}>
          <ThemedText
            variant="caption"
            style={[styles.supportText, isSenhaValida && styles.supportTextValid]}
          >
            {isSenhaValida ? '✓ Mínimo de 6 caracteres atendido' : 'Mínimo de 6 caracteres'}
          </ThemedText>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              AppDialog.info(
                'Recuperação de Acesso',
                'Para redefinir sua senha de gestor, entre em contato com o administrador da conta ou o suporte.'
              )
            }
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ThemedText variant="caption" style={styles.esqueceuLink}>
              Esqueceu a senha?
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    marginHorizontal: tokens.spacing.lg,
    marginBottom: tokens.spacing.md,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  headerTitle: {
    color: tokens.colors.textPrimary,
  },
  fieldGroup: {
    marginBottom: tokens.spacing.md,
  },
  inputLabel: {
    fontWeight: '700',
    color: tokens.colors.textSecondary,
    marginBottom: 6,
    fontSize: tokens.typography.fontXs,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.md,
    height: 48,
    gap: tokens.spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: tokens.typography.fontMd,
    color: tokens.colors.textPrimary,
  },
  eyeButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -tokens.spacing.sm,
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  supportText: {
    color: tokens.colors.textMuted,
    fontSize: 11,
  },
  supportTextValid: {
    color: tokens.colors.status.greenText,
    fontWeight: '600',
  },
  esqueceuLink: {
    color: tokens.colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
});
