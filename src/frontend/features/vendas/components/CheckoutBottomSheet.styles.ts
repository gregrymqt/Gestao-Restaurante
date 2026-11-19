import { StyleSheet } from 'react-native';
import { tokens } from '@/components/primitives/tokens';

export const checkoutStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: tokens.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.sm,
    maxHeight: '90%',
  },
  dragIndicator: {
    width: 44,
    height: 4,
    backgroundColor: '#D9D9D9',
    borderRadius: tokens.radii.full,
    alignSelf: 'center',
    marginBottom: tokens.spacing.md,
  },
  scrollContent: {
    paddingBottom: tokens.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    flex: 1,
  },
  tituloComanda: {
    fontSize: tokens.typography.fontXl,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  badgeMesa: {
    backgroundColor: '#F4F4F4',
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: tokens.radii.full,
  },
  textoBadgeMesa: {
    color: tokens.colors.textSecondary,
    fontSize: tokens.typography.fontXs,
    fontWeight: '500',
  },
  botaoFechar: {
    width: 44,
    height: 44,
    borderRadius: tokens.radii.full,
    backgroundColor: '#F4F4F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerFixo: {
    paddingTop: tokens.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.border,
  },
  botaoConfirmar: {
    height: 54,
    borderRadius: 14,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: tokens.spacing.xs,
  },
  botaoConfirmarDesabilitado: {
    opacity: 0.5,
    backgroundColor: tokens.colors.textMuted,
  },
  botaoConfirmarPressionado: {
    opacity: 0.88,
    backgroundColor: tokens.colors.primaryDark,
  },
  botaoConfirmarSucesso: {
    backgroundColor: '#16A34A',
  },
  botaoConfirmarConteudo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  textoConfirmar: {
    fontSize: tokens.typography.fontMd,
    fontWeight: '700',
  },
  microcopiaRodape: {
    textAlign: 'center',
    color: tokens.colors.textMuted,
    fontSize: tokens.typography.fontXs,
    marginTop: tokens.spacing.xs,
  },
});
