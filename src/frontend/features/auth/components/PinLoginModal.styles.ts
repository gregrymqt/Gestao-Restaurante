import { StyleSheet } from 'react-native';
import { tokens } from '@/components/primitives/tokens';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.lg,
  },
  keyboardContainer: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  nomeText: {
    marginBottom: 2,
    textAlign: 'center',
  },
  cargoText: {
    textAlign: 'center',
    marginBottom: tokens.spacing.lg,
  },
  inputGroup: {
    width: '100%',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
  },
  pinInput: {
    width: '100%',
    height: 52,
    borderRadius: tokens.radii.md,
    borderWidth: 2,
    borderColor: tokens.colors.primary,
    backgroundColor: tokens.colors.background,
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 16,
    color: tokens.colors.textPrimary,
  },
  hintText: {
    marginTop: tokens.spacing.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: tokens.spacing.md,
  },
  btnCancelar: {
    flex: 1,
    height: 48,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnConfirmar: {
    flex: 1.5,
    height: 48,
    borderRadius: tokens.radii.md,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
