import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { useRouter } from 'expo-router';
import { ArrowLeft, Construction } from 'lucide-react-native';
import { Colors, Spacing, Typography, Radius, IconSizes, TouchTargets } from '@/constants/theme';

interface TabPlaceholderScreenProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function TabPlaceholderScreen({
  title,
  description,
  icon,
}: TabPlaceholderScreenProps) {
  const router = useRouter();

  return (
    <ScreenWrapper>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          onPress={() => router.push('/(app)')}
        >
          <ArrowLeft size={IconSizes.sm} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: TouchTargets.min }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          {icon || <Construction size={36} color={Colors.light.warning} />}
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>Phase 2 Feature</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Return to Dashboard"
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={() => router.push('/(app)')}
        >
          <Text style={styles.actionButtonText}>Return to Dashboard</Text>
        </Pressable>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    width: TouchTargets.min,
    height: TouchTargets.min,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
  },
  backButtonPressed: {
    backgroundColor: Colors.light.surfaceMuted,
  },
  headerTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.text,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.light.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderColor: '#FDE68A', // Fallback
  },
  title: {
    ...Typography.sectionTitle,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  description: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  badge: {
    backgroundColor: Colors.light.borderSubtle,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    marginBottom: Spacing['2xl'],
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.text,
  },
  actionButton: {
    backgroundColor: Colors.light.text,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionButtonText: {
    ...Typography.button,
    color: Colors.light.surface,
  },
});
