import React from 'react';
import { View, StyleSheet, Pressable, Image, Text } from 'react-native';
import { Bell } from 'lucide-react-native';
import { Spacing, Radius } from '@/constants/theme';

interface HomeHeaderProps {
  onProfilePress?: () => void;
}

export function HomeHeader({ onProfilePress }: HomeHeaderProps) {
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

      {/* Right side: Notification / Profile */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notifications and profile"
        style={({ pressed }) => [
          styles.notificationButton,
          pressed && styles.notificationButtonPressed,
        ]}
        onPress={onProfilePress}
      >
        <Bell size={20} color="#0F172A" strokeWidth={2.4} />
        <View style={styles.notificationDot} />
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
  notificationButtonPressed: {
    backgroundColor: '#E2E8F0',
    transform: [{ scale: 0.95 }],
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E79524',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
