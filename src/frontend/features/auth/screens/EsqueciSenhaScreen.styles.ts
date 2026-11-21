import { StyleSheet, Platform, ViewStyle, TextStyle } from 'react-native';
import { tokens } from '@/components/primitives/tokens';
import { shadows } from '@/shared/utils/shadows';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
    ...(Platform.OS === 'web' ? ({ minHeight: '100dvh' } as unknown as ViewStyle) : {}),
  },
  scrollContent: {
    flexGrow: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
    ...(Platform.OS === 'web'
      ? ({
          minHeight: '100dvh',
          overflowY: 'auto',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        } as unknown as ViewStyle)
      : {}),
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
    ...(Platform.OS === 'web'
      ? ({
          outlineWidth: 0,
          outlineStyle: 'none',
        } as unknown as TextStyle)
      : {}),
  },
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    marginBottom: tokens.spacing.md,
    gap: 8,
  },
  offlineNoticeText: {
    color: '#92400E',
    flex: 1,
    fontSize: tokens.typography.fontXs,
    lineHeight: 16,
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
  buttonOffline: {
    opacity: 0.5,
    ...(Platform.OS === 'web' ? ({ cursor: 'not-allowed' } as unknown as ViewStyle) : {}),
  },
  voltarLoginButton: {
    minHeight: 44,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginTop: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.sm,
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
          transition: 'background-color 0.15s ease',
        } as unknown as ViewStyle)
      : {}),
  },
  voltarLoginButtonPressed: {
    backgroundColor: 'rgba(255, 247, 237, 0.6)',
  },
  voltarLoginTextoNeutro: {
    color: '#6B7280',
    fontSize: tokens.typography.fontSm,
  },
  voltarLoginTextoDestaque: {
    color: '#EA580C',
    fontWeight: '600',
    fontSize: tokens.typography.fontSm,
  },
});
