import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { HardHat } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { Colors, Typography, Spacing, Radius, IconSizes, TouchTargets } from '@/constants/theme';

interface HomeHeaderProps {
  onProfilePress?: () => void;
}

export function HomeHeader({ onProfilePress }: HomeHeaderProps) {
  const { session } = useAuth();
  const user = session?.user;

  // Extract display name or email username
  const rawName = user?.user_metadata?.full_name || user?.user_metadata?.name;
  const emailPrefix = user?.email ? user.email.split('@')[0] : '';
  const displayName = rawName || emailPrefix || 'Supervisor';

  // Format initials
  const initials = displayName
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'GR';

  // Dynamic greeting based on current time
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <View style={styles.container}>
      {/* Left side: Brand + Greeting */}
      <View style={styles.leftColumn}>
        <View style={styles.brandRow}>
          <View style={styles.brandIconWrapper}>
            <HardHat size={IconSizes.sm} color={Colors.light.brand} strokeWidth={2.4} />
          </View>
          <Text style={styles.brandText}>GRN</Text>
        </View>

        <Text style={styles.greetingText}>
          {greeting} <Text style={styles.waveEmoji}>👋</Text>
        </Text>
        <Text style={styles.userNameText} numberOfLines={1}>
          {displayName}
        </Text>
      </View>

      {/* Right side: Avatar / Profile Button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="User Profile"
        style={({ pressed }) => [
          styles.avatarButton,
          pressed && styles.avatarButtonPressed,
        ]}
        onPress={onProfilePress}
      >
        <View style={styles.avatarInner}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.activeDot} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderSubtle,
  },
  leftColumn: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  brandIconWrapper: {
    width: 22,
    height: 22,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: Colors.light.brand,
    textTransform: 'uppercase',
  },
  greetingText: {
    ...Typography.caption,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  waveEmoji: {
    fontSize: 13,
  },
  userNameText: {
    ...Typography.sectionTitle,
    color: Colors.light.brand,
    marginTop: 2,
  },
  avatarButton: {
    position: 'relative',
    padding: 2,
    borderRadius: Radius.full,
    minHeight: TouchTargets.min,
    minWidth: TouchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  avatarInner: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.primary,
  },
  avatarText: {
    ...Typography.body,
    color: Colors.light.surface,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activeDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.success,
    borderWidth: 2,
    borderColor: Colors.light.surface,
  },
});
