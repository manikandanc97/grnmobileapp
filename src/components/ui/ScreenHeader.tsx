import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Spacing, TouchTargets, Radius } from '@/constants/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
  showBorder?: boolean;
  showBack?: boolean;
}

export function ScreenHeader({ 
  title, 
  subtitle, 
  actionButton, 
  showBorder = true, 
  showBack = false 
}: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View style={[styles.header, showBorder && styles.headerBorder]}>
      {showBack && (
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={18} color="#0F172A" strokeWidth={2.5} />
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
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: '#FFFFFF',
  },
  headerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 23, 42, 0.05)',
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  actionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: TouchTargets.min,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  backButtonPressed: {
    opacity: 0.7,
    backgroundColor: '#E2E8F0',
    transform: [{ scale: 0.95 }],
  },
});
