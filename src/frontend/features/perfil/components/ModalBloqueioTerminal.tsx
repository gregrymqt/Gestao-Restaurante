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
import { Lock, AlertTriangle } from 'lucide-react-native';
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
  const [isFocused, setIsFocused] = useState(false);

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
          {/* Avatar com Badge de Cadeado Ancorado no Canto Inferior Direito */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>{operadorIniciais}</ThemedText>
            </View>
            <View style={styles.lockBadge}>
              <Lock size={13} color="#FFFFFF" />
            </View>
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
              style={[
                styles.pinInput,
                isFocused && styles.pinInputFocused,
                erro && styles.pinInputError,
              ]}
              placeholder={pin.length === 0 ? '••••' : ''}
              placeholderTextColor={tokens.colors.textMuted}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              value={pin}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChangeText={(txt) => {
                setPin(txt);
                if (erro) setErro(false);
              }}
              autoFocus
            />
            {erro && (
              <View style={styles.errorRow}>
                <AlertTriangle size={14} color={tokens.colors.status.redText} />
                <ThemedText variant="caption" color={tokens.colors.status.redText} style={styles.errorText}>
                  Digite ao menos 4 dígitos para desbloquear.
                </ThemedText>
              </View>
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
  avatarContainer: {
    position: 'relative',
    marginTop: tokens.spacing.xs,
    marginBottom: tokens.spacing.sm,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: tokens.typography.fontXl,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#111827',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
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
    ...(Platform.OS === 'web'
      ? { outlineWidth: 0 }
      : {}),
  },
  pinInputFocused: {
    borderColor: tokens.colors.primary,
    borderWidth: 2,
  },
  pinInputError: {
    borderColor: tokens.colors.status.redText,
    borderWidth: 2,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: tokens.spacing.xs,
  },
  errorText: {
    textAlign: 'center',
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
