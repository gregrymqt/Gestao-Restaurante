import { StyleSheet, Platform } from 'react-native';
import { tokens } from '@/components/primitives/tokens';
import { shadows } from '@/shared/utils/shadows';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  scrollContent: {
    paddingHorizontal: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxl,
  },
  topBar: {
    marginBottom: tokens.spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: tokens.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.border,
    ...shadows.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: tokens.spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: tokens.colors.primaryLight || '#FFF4ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: tokens.spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: tokens.spacing.md,
    lineHeight: 20,
  },
  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    padding: tokens.spacing.lg,
    ...shadows.sm,
  },
  fieldGroup: {
    marginBottom: tokens.spacing.md,
  },
  inputLabel: {
    color: tokens.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
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
    color: tokens.colors.textPrimary,
    fontSize: tokens.typography.fontMd,
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : {}),
  },
  actionButton: {
    backgroundColor: tokens.colors.primary,
    borderRadius: tokens.radii.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: tokens.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: tokens.spacing.md,
    paddingVertical: tokens.spacing.xs,
  },
});
