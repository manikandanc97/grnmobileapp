import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Shadows, Spacing } from '@/constants/theme';

const logoSource = require('../../../assets/images/logo.jpg');

export function StartupScreen() {
  return (
    <View style={styles.screen}>
      <Image
        source={logoSource}
        style={styles.logo}
        contentFit="cover"
        accessibilityLabel="GRN Constructions"
      />
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={Colors.light.brand} />
        <Text style={styles.text}>Getting ready…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: Spacing.lg,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 24,
    ...Shadows.md,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 36,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
    letterSpacing: 0.2,
  },
});
