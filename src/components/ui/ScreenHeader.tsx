import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, IconSizes, TouchTargets } from '@/constants/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
  showBorder?: boolean;
  showBack?: boolean;
}

export function ScreenHeader({ title, subtitle, actionButton, showBorder = true, showBack = false }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View style={[styles.header, showBorder && styles.headerBorder]}>
      {showBack && (
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <ArrowLeft size={IconSizes.lg} color={Colors.light.text} />
        </Pressable>
      )}
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
      {actionButton && (
        <View style={styles.actionContainer}>
          {actionButton}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md, // 16px
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surface,
  },
  headerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  headerTitle: {
    ...Typography.pageTitle,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.secondary,
    color: Colors.light.textSecondary,
  },
  actionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: TouchTargets.min,
  },
  backButton: {
    marginRight: Spacing.md,
    minHeight: TouchTargets.min,
    minWidth: TouchTargets.min,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -Spacing.sm, // pull slightly to left to align visual left edge
  },
  backButtonPressed: {
    opacity: 0.5,
  },
});
