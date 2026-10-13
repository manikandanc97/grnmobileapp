import React from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { ArrowUpRight, Building2 } from 'lucide-react-native';
import { MetricItem } from '@/types/dashboard';
import { DashboardMetrics } from '@/services/dashboard';
import { formatCurrency } from '@/lib/finance';
import { Colors, Spacing, Radius, Typography } from '@/constants/theme';
import { UiStyles } from '@/constants/uiStyles';

interface Props { metricsData?: DashboardMetrics | null; onCardPress?: (metric: MetricItem) => void }
export function OverviewSection({ metricsData, onCardPress }: Props) {
  const { width } = useWindowDimensions();
  const active: MetricItem = { id: 'active-sites', label: 'Active sites', value: String(metricsData?.activeSites ?? '—'), iconName: 'Building2' };
  const small: MetricItem[] = [
    { id: 'workers-present', label: 'Workers today', value: String(metricsData?.totalActiveLabor ?? '—'), iconName: 'Users' },
    { id: 'this-month', label: 'Expenses this month', value: metricsData ? formatCurrency(metricsData.thisMonthExpenses) : '—', iconName: 'IndianRupee' },
  ];
  return (
    <View style={styles.container}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${active.value} active sites, view sites`} onPress={() => onCardPress?.(active)} style={({ pressed }) => [styles.hero, pressed && styles.pressed]}>
        <View style={styles.heroTop}><Text style={styles.eyebrow}>Site overview</Text><Building2 size={22} color={Colors.light.onPrimary} strokeWidth={1.6} /></View>
        <View style={styles.heroBottom}><View><Text style={styles.heroValue}>{active.value}</Text><Text style={styles.heroLabel}>Active sites</Text></View><View style={styles.heroLink}><Text style={styles.heroLinkText}>View sites</Text><ArrowUpRight size={18} color={Colors.light.onPrimary} /></View></View>
        <View style={styles.accent} />
      </Pressable>
      <View style={styles.row}>
        {small.map(card => <Pressable key={card.id} accessibilityRole="button" accessibilityLabel={`${card.label}: ${card.value}`} onPress={() => onCardPress?.(card)} style={({ pressed }) => [styles.stat, pressed && styles.pressed]}><Text style={styles.label}>{card.label}</Text><Text style={[styles.value, width < 360 && { fontSize: 18 }]} adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1}>{card.value}</Text></Pressable>)}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  hero: { backgroundColor: Colors.light.brand, borderRadius: Radius.xl, padding: 22, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontSize: 14, fontWeight: '500', color: Colors.light.onPrimary },
  heroBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 20, gap: 8 },
  heroValue: { fontSize: 42, lineHeight: 48, fontWeight: '600', color: Colors.light.onPrimary },
  heroLabel: { fontSize: 13, color: Colors.light.onPrimary, marginTop: 4 },
  heroLink: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4 },
  heroLinkText: { fontSize: 12, fontWeight: '500', color: Colors.light.onPrimary },
  accent: { position: 'absolute', left: 22, top: 0, width: 36, height: 3, backgroundColor: Colors.light.accent, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  row: { flexDirection: 'row', gap: 10, marginTop: 10 },
  stat: { ...UiStyles.card, flex: 1, gap: 8 },
  label: { fontSize: 12, lineHeight: 18, color: Colors.light.textSecondary },
  value: { ...Typography.pageTitle, fontSize: 22, color: Colors.light.text },
  pressed: { opacity: 0.85 },
});
