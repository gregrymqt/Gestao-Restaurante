import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  RefreshCw,
  Printer,
  CheckCircle2,
  MonitorSmartphone,
} from 'lucide-react-native';
import { ThemedText } from '@/components/primitives/ThemedText';
import { tokens } from '@/components/primitives/tokens';
import { shadows } from '@/shared/utils/shadows';
import { TerminalStatus } from '../types';

interface TerminalStatusCardProps {
  status: TerminalStatus | null;
  isSseConnected: boolean;
  isOffline?: boolean;
}

export function TerminalStatusCard({
  status,
  isSseConnected,
  isOffline = false,
}: TerminalStatusCardProps) {
  const impressoraNome = status?.impressoraNome || 'Bluetooth 80mm • Bobina 75%';
  const impressoraStatus = status?.impressoraStatus || 'Pronta';
  const versaoApp = status?.versaoApp?.replace(/Expo SDK \d+ •\s*/i, '') || 'Versão 1.0.0';
  const buildNumero = status?.buildNumero || 'Build 104';

  const isOnline = isSseConnected && !isOffline;

  return (
    <View style={styles.container}>
      <ThemedText style={styles.sectionTitle}>
        STATUS DO TERMINAL & DISPOSITIVOS
      </ThemedText>

      <View style={styles.card}>
        {/* Linha 1: SSE Real-Time Sync */}
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={styles.iconBox}>
              <RefreshCw size={18} color={tokens.colors.primary} />
            </View>
            <View style={styles.rowText}>
              <ThemedText style={styles.rowTitle}>Sincronização SSE</ThemedText>
              <ThemedText style={styles.rowSub}>
                Canais de pedidos & cozinha
              </ThemedText>
            </View>
          </View>

          <View
            style={[
              styles.statusPill,
              isOnline ? styles.pillOnline : styles.pillOffline,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isOnline
                    ? tokens.colors.status.greenText
                    : tokens.colors.status.redText,
                },
              ]}
            />
            <ThemedText
              style={[
                styles.statusPillText,
                {
                  color: isOnline
                    ? tokens.colors.status.greenText
                    : tokens.colors.status.redText,
                },
              ]}
            >
              {isOnline ? 'Online' : 'Offline (Cache Local)'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Linha 2: Impressora Térmica */}
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={styles.iconBox}>
              <Printer size={18} color={tokens.colors.primary} />
            </View>
            <View style={styles.rowText}>
              <ThemedText style={styles.rowTitle}>Impressora Térmica</ThemedText>
              <ThemedText style={styles.rowSub}>{impressoraNome}</ThemedText>
            </View>
          </View>

          <View style={styles.printerStatusBox}>
            <CheckCircle2 size={13} color={tokens.colors.status.greenText} />
            <ThemedText style={styles.printerStatusText}>{impressoraStatus}</ThemedText>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Linha 3: Versão do Sistema */}
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={styles.iconBox}>
              <MonitorSmartphone size={18} color={tokens.colors.primary} />
            </View>
            <View style={styles.rowText}>
              <ThemedText style={styles.rowTitle}>Versão do Sistema</ThemedText>
              <ThemedText style={styles.rowSub}>{versaoApp}</ThemedText>
            </View>
          </View>

          <View style={styles.buildBadge}>
            <ThemedText style={styles.buildText}>{buildNumero}</ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing.xs,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.textSecondary,
    letterSpacing: 0.5,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.radii.lg,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    ...shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: tokens.spacing.sm,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: tokens.radii.sm,
    backgroundColor: tokens.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIcon: {
    fontSize: 18,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: tokens.typography.fontSm,
    fontWeight: '700',
    color: tokens.colors.textPrimary,
  },
  rowSub: {
    fontSize: tokens.typography.fontXs,
    color: tokens.colors.textMuted,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 4,
    borderRadius: tokens.radii.full,
  },
  pillOnline: {
    backgroundColor: tokens.colors.status.greenBg,
  },
  pillOffline: {
    backgroundColor: tokens.colors.status.redBg,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: tokens.radii.full,
  },
  statusPillText: {
    fontSize: tokens.typography.fontXs,
    fontWeight: '700',
  },
  printerStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  printerStatusIcon: {
    fontSize: 13,
  },
  printerStatusText: {
    fontSize: tokens.typography.fontSm,
    fontWeight: '700',
    color: tokens.colors.status.greenText,
  },
  buildBadge: {
    backgroundColor: tokens.colors.background,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 3,
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  buildText: {
    fontSize: 11,
    fontWeight: '700',
    color: tokens.colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.border,
    marginHorizontal: tokens.spacing.sm,
  },
});
