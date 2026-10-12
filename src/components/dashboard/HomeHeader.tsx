import React from 'react';
import { View, StyleSheet, Pressable, Image, Text } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { useNotifications } from '@/hooks/useNotifications';
import { Spacing, Radius } from '@/constants/theme';

interface HomeHeaderProps {
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
}

export function HomeHeader({ onProfilePress, onNotificationPress }: HomeHeaderProps) {
  const router = useRouter();
  const { session } = useAuth();
  const { unreadCount } = useNotifications();
  const user = session?.user;

  // Extract display name or email username
  const rawName = user?.user_metadata?.full_name || user?.user_metadata?.name;
  const emailPrefix = user?.email ? user.email.split('@')[0] : '';
  const displayName = rawName || emailPrefix || 'Supervisor';

  // Format initials
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'GR';

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <View style={styles.container}>
      {/* Left: Brand Logo and Title */}
      <View style={styles.brandLeft}>
        <View style={styles.logoWrapper}>
          <Image 
            source={require('@/assets/images/icon.png')} 
            style={styles.logoImage} 
            resizeMode="cover" 
          />
        </View>
        <View style={styles.brandTitleContainer}>
          <Text style={styles.brandText}>GRN Connect</Text>
          <View style={styles.badgeContainer}>
            <View style={styles.activePill} />
            <Text style={styles.badgeText}>CONSTRUCTION SUITE</Text>
          </View>
        </View>
      </View>

      {/* Right side: Notification + Profile Actions */}
      <View style={styles.actionsRight}>
        {/* Notification Bell */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
          style={({ pressed }) => [
            styles.notificationButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => {
            if (onNotificationPress) {
              onNotificationPress();
            } else {
              router.push('/(app)/more/notifications' as any);
            }
          }}
        >
          <Bell size={20} color="#0F172A" strokeWidth={2.4} />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Profile Avatar */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="User profile"
          style={({ pressed }) => [
            styles.profileButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={onProfilePress}
        >
          {avatarUrl ? (
            <Image 
              source={{ uri: avatarUrl }} 
              style={styles.avatarImage} 
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.profileActiveDot} />
        </Pressable>
      </View>
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
    paddingBottom: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 23, 42, 0.05)',
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoWrapper: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    elevation: 2,
    shadowColor: '#07566A',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTitleContainer: {
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  activePill: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationButton: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.05)',
  },
  buttonPressed: {
    backgroundColor: '#E2E8F0',
    transform: [{ scale: 0.95 }],
  },
  notificationBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    zIndex: 10,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 12,
  },
  profileButton: {
    position: 'relative',
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E79524',
    shadowColor: '#07566A',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.full,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.full,
    backgroundColor: '#07566A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profileActiveDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: Radius.full,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
