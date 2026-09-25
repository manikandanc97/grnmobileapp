import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/logo.jpg')}
        style={styles.logo}
        contentFit="contain"
      />
      <View style={styles.textContainer}>
        <ThemedText type="title" style={styles.title}>{title}</ThemedText>
        <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: Spacing.five,
    marginTop: Spacing.four,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: Spacing.four,
  },
  textContainer: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.8,
    paddingHorizontal: Spacing.three,
  },
});
