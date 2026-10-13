import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { BrandMark } from '@/components/brand/BrandMark';
import { Colors, Spacing } from '@/constants/theme';

export function StartupScreen() {
  return <View style={styles.screen}><BrandMark size={72} /><View style={styles.loading}><ActivityIndicator color={Colors.light.brand} /><Text style={styles.text}>Getting ready…</Text></View></View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.background, padding: Spacing.lg },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: Spacing.xl },
  text: { fontSize: 14, color: Colors.light.textSecondary },
});
