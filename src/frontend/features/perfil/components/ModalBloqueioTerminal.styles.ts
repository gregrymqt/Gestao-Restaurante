import { StyleSheet, Platform, ViewStyle, TextStyle } from 'react-native';
import { tokens } from '@/components/primitives/tokens';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
    ...(Platform.OS === 'web' ? ({ minHeight: '100dvh' } as unknown as ViewStyle) : {}),
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
    ...(Platform.OS === 'web'
      ? ({
          minHeight: '100dvh',
          overflowY: 'auto',
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
        } as unknown as ViewStyle)
      : {}),
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
    backgroundColor: tokens.colors.white,
    borderWidth: 1,
    borderColor: '#D1D5DB', // border-gray-300 suave
    borderRadius: tokens.radii.md,
    paddingVertical: tokens.spacing.sm + 2,
    fontSize: tokens.typography.fontXl,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 8,
    color: '#111827', // text-gray-900
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
          outline: 'none',
          outlineWidth: 0,
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        } as unknown as TextStyle)
      : {}),
  },
  pinInputFocused: {
    borderColor: '#EA580C', // focus:border-orange-600
    borderWidth: 2,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 0 0 3px rgba(234, 88, 12, 0.2)', // focus:ring-2 focus:ring-orange-600/20
        } as unknown as TextStyle)
      : {}),
  },
  pinInputError: {
    borderColor: '#DC2626',
    borderWidth: 2,
  },
  errorContainer: {
    minHeight: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: tokens.spacing.xs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  errorText: {
    textAlign: 'center',
    color: '#DC2626',
    fontWeight: '500',
  },
  desbloquearButton: {
    width: '100%',
    backgroundColor: tokens.colors.primary,
    paddingVertical: tokens.spacing.sm + 4,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginBottom: tokens.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  trocarButton: {
    minHeight: 44,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginTop: 4,
    ...(Platform.OS === 'web'
      ? ({
          cursor: 'pointer',
          transition: 'background-color 0.15s ease',
        } as unknown as ViewStyle)
      : {}),
  },
  trocarButtonPressed: {
    backgroundColor: '#F3F4F6', // hover:bg-gray-100
  },
  trocarText: {
    fontSize: tokens.typography.fontSm,
    fontWeight: '500',
    color: '#4B5563', // text-gray-600
  },
});
