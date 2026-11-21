import { StyleSheet } from 'react-native';
import { tokens } from '@/components/primitives/tokens';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E1E2C',
  },
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  header: {
    backgroundColor: '#1E1E2C',
    paddingHorizontal: tokens.spacing.lg,
    paddingTop: tokens.spacing.xs,
    paddingBottom: tokens.spacing.md,
  },
  topoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  tagAdmin: {
    backgroundColor: tokens.colors.primary,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: tokens.radii.full,
  },
  botaoFechar: {
    padding: tokens.spacing.xs,
  },
  fecharTexto: {
    color: tokens.colors.white,
    fontSize: 18,
  },
  titulo: {
    color: tokens.colors.white,
    fontSize: tokens.typography.fontLg,
  },
  subtitulo: {
    color: '#B0B0C0',
    marginTop: 2,
    marginBottom: tokens.spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: tokens.radii.sm,
    backgroundColor: '#2B2B3D',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  chipAtivo: {
    backgroundColor: tokens.colors.primary,
  },
  buscaContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputBusca: {
    backgroundColor: '#2B2B3D',
    borderRadius: tokens.radii.sm,
    paddingHorizontal: tokens.spacing.md,
    paddingRight: 36,
    paddingVertical: 10,
    fontSize: tokens.typography.fontSm,
    color: tokens.colors.white,
  },
  botaoLimparBusca: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  listWrapper: {
    flex: 1,
  },
  flashListContent: {
    padding: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xxl,
  },
  pressed: {
    opacity: 0.7,
  },
});
