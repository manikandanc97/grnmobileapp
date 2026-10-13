import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Radius, Shadows } from '@/constants/theme';

const logoSource = require('../../../assets/images/logo.jpg');

export function BrandMark({ size = 44, showName = true }: { size?: number; showName?: boolean }) {
  return (
    <View style={styles.row} accessibilityLabel="GRN Constructions">
      <Image
        source={logoSource}
        style={[styles.logo, { width: size, height: size }]}
        contentFit="cover"
        accessibilityLabel="GRN logo"
      />
      {showName && (
        <View style={styles.words}>
          <Text style={[styles.name, size > 50 && { fontSize: 23, lineHeight: 26 }]}>GRN</Text>
          <Text style={[styles.tagline, size > 50 && { fontSize: 10, lineHeight: 13 }]}>CONSTRUCTIONS</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  logo: {
    borderRadius: Radius.md,
    ...Shadows.sm,
  },
  words: { flexShrink: 1, gap: 2 },
  name: { fontSize: 21, lineHeight: 24, fontWeight: '700', letterSpacing: 1, color: Colors.light.brand },
  tagline: { fontSize: 9, lineHeight: 12, fontWeight: '600', letterSpacing: 1.3, color: Colors.light.accentInk },
});
