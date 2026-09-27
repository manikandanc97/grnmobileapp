import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { HardHat } from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';

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
            <HardHat size={16} color="#07566A" strokeWidth={2.4} />
          </View>
          <Text style={styles.brandText}>GRN CONSTRUCTIONS</Text>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  leftColumn: {
    flex: 1,
    paddingRight: 16,
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
    borderRadius: 6,
    backgroundColor: '#E79524',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#07566A',
    textTransform: 'uppercase',
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7A85',
  },
  waveEmoji: {
    fontSize: 13,
  },
  userNameText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#07566A',
    letterSpacing: -0.3,
    marginTop: 1,
  },
  avatarButton: {
    position: 'relative',
    padding: 2,
    borderRadius: 24,
  },
  avatarButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  avatarInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#07566A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E79524',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
