import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { Spacing, Radius, Shadows } from '@/constants/theme';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.logoCard}>
        <Image
          source={require('@/assets/images/logo.jpg')}
          style={styles.logo}
          contentFit="contain"
        />
      </View>
      <View style={styles.textContainer}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    marginTop: Spacing.lg,
  },
  logoCard: {
    width: 88,
    height: 88,
    borderRadius: Radius.xl,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    marginBottom: Spacing.lg,
    ...Shadows.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md,
  },
  textContainer: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.6,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    fontWeight: '500',
    paddingHorizontal: Spacing.sm,
  },
});
