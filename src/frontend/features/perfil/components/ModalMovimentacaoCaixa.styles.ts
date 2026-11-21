import { StyleSheet, Platform } from 'react-native';
import { tokens } from '@/components/primitives/tokens';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
    ...(Platform.OS === 'web'
      ? {
          position: 'fixed' as any,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
        }
      : {}),
  },
  keyboardContainer: {
    width: '100%',
  },
  sheetContainer: {
    backgroundColor: tokens.colors.white,
    borderTopLeftRadius: tokens.radii.lg,
    borderTopRightRadius: tokens.radii.lg,
    maxHeight: '85%',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: tokens.spacing.md,
    marginHorizontal: tokens.spacing.md,
    marginTop: tokens.spacing.xs,
    borderRadius: tokens.radii.md,
    gap: tokens.spacing.sm,
  },
  headerSuprimento: {
    backgroundColor: '#1E6B3A',
  },
  headerSangria: {
    backgroundColor: '#A82A2A',
  },
  headerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    flex: 1,
  },
  headerSubtext: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    fontSize: tokens.typography.fontXs,
  },
  formScroll: {
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
  },
  saldoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: tokens.colors.background,
    padding: tokens.spacing.sm,
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    marginBottom: tokens.spacing.sm,
  },
  inputGroup: {
    marginBottom: tokens.spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  label: {
    color: tokens.colors.textMuted,
    letterSpacing: 0.5,
  },
  projecaoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: tokens.colors.background,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 8,
    borderRadius: tokens.radii.sm,
    marginTop: tokens.spacing.xs,
    marginBottom: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  projecaoLabel: {
    color: tokens.colors.textMuted,
    fontSize: tokens.typography.fontXs,
  },
  projecaoValor: {
    fontSize: tokens.typography.fontXs,
    fontWeight: '700',
  },
  inputValor: {
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    fontSize: tokens.typography.fontXl,
    fontWeight: '800',
    color: tokens.colors.textPrimary,
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none', outline: 'none' } as any)
      : {}),
  },
  inputValorFocadoSuprimento: {
    borderColor: '#059669',
    borderWidth: 2,
  },
  inputValorFocadoSangria: {
    borderColor: '#D97706',
    borderWidth: 2,
  },
  chipsContainer: {
    marginBottom: tokens.spacing.md,
  },
  chipsLabel: {
    color: tokens.colors.textMuted,
    marginBottom: tokens.spacing.xs,
    fontSize: tokens.typography.fontXs,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: tokens.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: tokens.radii.full,
    borderWidth: 1,
    borderColor: tokens.colors.primary,
  },
  chipTudo: {
    backgroundColor: tokens.colors.status.redBg,
    borderColor: tokens.colors.status.redText,
  },
  inputMotivo: {
    backgroundColor: tokens.colors.background,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radii.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    fontSize: tokens.typography.fontSm,
    color: tokens.colors.textPrimary,
    ...(Platform.OS === 'web'
      ? ({ outlineStyle: 'none', outline: 'none' } as any)
      : {}),
  },
  inputErrorBorder: {
    borderColor: tokens.colors.status.redText,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFECEC',
    padding: tokens.spacing.sm,
    borderRadius: tokens.radii.sm,
    marginBottom: tokens.spacing.sm,
  },
  errorText: {
    flex: 1,
  },
  footerFixed: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingTop: tokens.spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? tokens.spacing.xl : tokens.spacing.md,
    backgroundColor: tokens.colors.white,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
  cancelarButton: {
    flex: 1,
    paddingVertical: tokens.spacing.sm + 2,
    borderRadius: tokens.radii.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  cancelarText: {
    fontWeight: '700',
    color: tokens.colors.textMuted,
  },
  confirmarButton: {
    flex: 2,
    paddingVertical: tokens.spacing.sm + 2,
    borderRadius: tokens.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  confirmarSuprimento: {
    backgroundColor: '#1E6B3A',
  },
  confirmarSangria: {
    backgroundColor: '#A82A2A',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
