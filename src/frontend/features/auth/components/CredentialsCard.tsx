import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

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
  const isPinValido = palavraPasse.length >= 6;

  return (
    <View style={styles.card}>
      {/* Header do Card */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <ThemedText style={styles.userIcon}>👤</ThemedText>
          <ThemedText variant="body" style={styles.headerTitle}>
            Credenciais do Caixa
          </ThemedText>
        </View>

        <View style={styles.turnoBadge}>
          <ThemedText variant="caption" style={styles.turnoBadgeText}>
            Turno Almoço
          </ThemedText>
        </View>
      </View>

      {/* Campo 1: Identificador */}
      <View style={styles.fieldGroup}>
        <ThemedText variant="caption" style={styles.inputLabel}>
          E-mail ou Matrícula do Operador
        </ThemedText>

        <View style={styles.inputBox}>
          <ThemedText style={styles.inputIcon}>🆔</ThemedText>
          <TextInput
            style={styles.textInput}
            placeholder="operador@gastropdv.com.br ou matrícula"
            placeholderTextColor={tokens.colors.textMuted}
            value={identificador}
            onChangeText={onIdentificadorChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {isIdentificadorPreenchido && (
            <View style={styles.validCheckDot}>
              <ThemedText style={styles.checkIcon}>✓</ThemedText>
            </View>
          )}
        </View>
      </View>

      {/* Campo 2: Senha / PIN */}
      <View style={styles.fieldGroup}>
        <View style={styles.senhaLabelRow}>
          <ThemedText variant="caption" style={styles.inputLabel}>
            Senha de Acesso (PIN ou Alfanumérico)
          </ThemedText>

          <View style={styles.pinRapidoBadge}>
            <ThemedText variant="caption" style={styles.pinRapidoText}>
              PIN Rápido
            </ThemedText>
          </View>
        </View>

        <View style={styles.inputBox}>
          <ThemedText style={styles.inputIcon}>🔒</ThemedText>
          <TextInput
            style={styles.textInput}
            placeholder="••••••"
            placeholderTextColor={tokens.colors.textMuted}
            secureTextEntry={!mostrarSenha}
            keyboardType="numeric"
            value={palavraPasse}
            onChangeText={onPalavraPasseChange}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setMostrarSenha((prev) => !prev)}
            style={styles.eyeButton}
          >
            <ThemedText style={styles.eyeIcon}>
              {mostrarSenha ? '👁️' : '🙈'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Linha de Suporte e Recuperação */}
        <View style={styles.supportRow}>
          <ThemedText
            variant="caption"
            style={[styles.supportText, isPinValido && styles.supportTextValid]}
          >
            ✓ Autenticação de 6 dígitos ativa
          </ThemedText>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                'Recuperação de Chave',
                'Solicite o reset do seu PIN de operador junto ao Gerente do Restaurante.'
              )
            }
          >
            <ThemedText variant="caption" style={styles.esqueceuLink}>
              Esqueceu a chave?
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
    padding: tokens.spacing.md,
    marginHorizontal: tokens.spacing.md,
    marginBottom: tokens.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
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
    gap: 6,
  },
  userIcon: {
    fontSize: 16,
  },
  headerTitle: {
    fontWeight: '800',
    color: tokens.colors.textPrimary,
  },
  turnoBadge: {
    backgroundColor: '#F1F3F4',
    paddingHorizontal: tokens.spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: tokens.radii.sm,
  },
  turnoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.textSecondary,
  },
  fieldGroup: {
    marginBottom: tokens.spacing.sm,
  },
  inputLabel: {
    fontWeight: '700',
    color: tokens.colors.textPrimary,
    marginBottom: 4,
  },
  senhaLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pinRapidoBadge: {
    backgroundColor: tokens.colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: tokens.radii.sm,
  },
  pinRapidoText: {
    color: tokens.colors.primaryDark,
    fontSize: 10,
    fontWeight: '800',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.sm,
    height: 48,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: tokens.spacing.xs,
  },
  textInput: {
    flex: 1,
    fontSize: tokens.typography.fontSm,
    color: tokens.colors.textPrimary,
    paddingVertical: 0,
  },
  validCheckDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: tokens.colors.status.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    fontSize: 11,
    color: tokens.colors.status.greenText,
    fontWeight: '800',
  },
  eyeButton: {
    padding: tokens.spacing.xs,
  },
  eyeIcon: {
    fontSize: 16,
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
    fontWeight: '700',
  },
  esqueceuLink: {
    color: tokens.colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
});
