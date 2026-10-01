import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';

interface ModalBloqueioTerminalProps {
  visible: boolean;
  operadorNome: string;
  operadorIniciais: string;
  onDesbloquear: () => void;
  onLogout: () => void;
}

export function ModalBloqueioTerminal({
  visible,
  operadorNome,
  operadorIniciais,
  onDesbloquear,
  onLogout,
}: ModalBloqueioTerminalProps) {
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState(false);

  const handleTentarDesbloqueio = () => {
    // Validação mínima de PIN (qualquer PIN de 4 dígitos ou PIN cadastrado)
    if (pin.length >= 4) {
      setPin('');
      setErro(false);
      onDesbloquear();
    } else {
      setErro(true);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={() => {}}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.content}>
          {/* Ícone de Cadeado & Avatar */}
          <View style={styles.lockBadge}>
            <ThemedText style={styles.lockIcon}>🔒</ThemedText>
          </View>

          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>{operadorIniciais}</ThemedText>
          </View>

          <ThemedText variant="title" style={styles.title}>
            Terminal Bloqueado
          </ThemedText>
          <ThemedText variant="body" color={tokens.colors.textMuted} style={styles.subtitle}>
            Sessão de {operadorNome} pausada. O caixa e as rotinas fiscais permanecem abertos.
          </ThemedText>

          {/* Campo de PIN */}
          <View style={styles.pinContainer}>
            <ThemedText variant="caption" weight="bold" style={styles.pinLabel}>
              DIGITE O PIN DE DESBLOQUEIO:
            </ThemedText>
            <TextInput
              style={[styles.pinInput, erro && styles.pinInputError]}
              placeholder="••••"
              placeholderTextColor={tokens.colors.textMuted}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              value={pin}
              onChangeText={(txt) => {
                setPin(txt);
                if (erro) setErro(false);
              }}
              autoFocus
            />
            {erro && (
              <ThemedText variant="caption" color={tokens.colors.status.redText} style={styles.errorText}>
                ⚠️ Digite ao menos 4 dígitos para desbloquear.
              </ThemedText>
            )}
          </View>

          {/* Botões de Ação */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.desbloquearButton}
            onPress={handleTentarDesbloqueio}
          >
            <ThemedText variant="body" weight="bold" color="#FFFFFF">
              Desbloquear Terminal
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.trocarButton}
            onPress={onLogout}
          >
            <ThemedText variant="caption" style={styles.trocarText}>
              Trocar de Operador ou Sair
            </ThemedText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.xl,
  },
  content: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: tokens.colors.white,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  lockBadge: {
    position: 'absolute',
    top: -20,
    backgroundColor: tokens.colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    fontSize: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.sm,
  },
  avatarText: {
    fontSize: tokens.typography.fontXl,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  title: {
    fontSize: tokens.typography.fontLg,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
    marginTop: tokens.spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: tokens.spacing.xs,
    marginBottom: tokens.spacing.lg,
    lineHeight: 20,
  },
  pinContainer: {
    width: '100%',
    marginBottom: tokens.spacing.lg,
  },
  pinLabel: {
    color: tokens.colors.textMuted,
    marginBottom: tokens.spacing.xs,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  pinInput: {
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    paddingVertical: tokens.spacing.sm + 2,
    fontSize: tokens.typography.fontXl,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 8,
    color: tokens.colors.textPrimary,
  },
  pinInputError: {
    borderColor: tokens.colors.status.redText,
  },
  errorText: {
    textAlign: 'center',
    marginTop: tokens.spacing.xs,
  },
  desbloquearButton: {
    width: '100%',
    backgroundColor: tokens.colors.primary,
    paddingVertical: tokens.spacing.sm + 4,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginBottom: tokens.spacing.md,
  },
  trocarButton: {
    paddingVertical: tokens.spacing.xs,
  },
  trocarText: {
    color: tokens.colors.textMuted,
    textDecorationLine: 'underline',
  },
});
