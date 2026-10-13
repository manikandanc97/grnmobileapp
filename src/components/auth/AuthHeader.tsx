import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { BrandMark } from '@/components/brand/BrandMark';
import { Colors, Spacing, Typography } from '@/constants/theme';

export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <View style={styles.container}><BrandMark size={64} /><View style={styles.accent} /><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text></View>;
}
const styles = StyleSheet.create({
  container: { alignItems: 'flex-start', paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  accent: { width: 32, height: 3, backgroundColor: Colors.light.accent, borderRadius: 2, marginTop: 32, marginBottom: 18 },
  title: { ...Typography.display, color: Colors.light.text },
  subtitle: { ...Typography.body, color: Colors.light.textSecondary, marginTop: 8, maxWidth: 300 },
});
