import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Radius } from '@/constants/theme';

export function BrandMark({ size = 44, showName = true }: { size?: number; showName?: boolean }) {
  return (
    <View style={styles.row} accessibilityLabel="GRN Constructions">
      <Image source={require('@/assets/images/logo.jpg')} style={[styles.logo, { width: size, height: size }]} contentFit="contain" accessibilityLabel="GRN logo" />
      {showName && <View style={styles.words}><Text style={styles.name}>GRN</Text><Text style={styles.tagline}>CONSTRUCTIONS</Text></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  logo: { borderRadius: Radius.sm, backgroundColor: Colors.light.accent },
  words: { flexShrink: 1, gap: 2 },
  name: { fontSize: 21, lineHeight: 24, fontWeight: '700', letterSpacing: 1, color: Colors.light.brand },
  tagline: { fontSize: 9, lineHeight: 12, fontWeight: '600', letterSpacing: 1.3, color: Colors.light.accentInk },
});
