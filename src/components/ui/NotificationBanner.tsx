import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell, Box, Users, IndianRupee, Activity, X } from 'lucide-react-native';
import { useNotifications } from '@/providers/NotificationProvider';
import { Colors, Typography, Radius, Shadows } from '@/constants/theme';
import { NotificationType } from '@/services/notifications';

export function NotificationBanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeBanner, dismissBanner, markAsRead } = useNotifications();

  const [translateY] = useState(() => new Animated.Value(-120));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (activeBanner) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 70,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeBanner, translateY, opacity]);

  if (!activeBanner) {
    return null;
  }

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'material':
        return <Box size={18} color={Colors.light.warning} />;
      case 'attendance':
        return <Users size={18} color={Colors.light.success} />;
      case 'expense':
        return <IndianRupee size={18} color={Colors.light.primary} />;
      case 'progress':
        return <Activity size={18} color={Colors.light.info} />;
      default:
        return <Bell size={18} color={Colors.light.info} />;
    }
  };

  const getIconBg = (type: NotificationType) => {
    switch (type) {
      case 'material':
        return Colors.light.warningBg;
      case 'attendance':
        return Colors.light.successBg;
      case 'expense':
        return Colors.light.primaryBg;
      default:
        return Colors.light.infoBg;
    }
  };

  const handlePress = () => {
    if (activeBanner) {
      markAsRead(activeBanner.id);
      dismissBanner();
      router.push('/(app)/more/notifications' as any);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: Math.max(insets.top, Platform.OS === 'ios' ? 44 : 12) + 8,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        style={({ pressed }) => [
          styles.banner,
          pressed && styles.bannerPressed,
        ]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Notification: ${activeBanner.title}`}
      >
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: getIconBg(activeBanner.type) },
          ]}
        >
          {getIcon(activeBanner.type)}
        </View>

        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>
              {activeBanner.title}
            </Text>
            <Text style={styles.badgeText}>Just now</Text>
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {activeBanner.message}
          </Text>
        </View>

        <Pressable
          style={styles.closeButton}
          onPress={(e) => {
            e.stopPropagation();
            dismissBanner();
          }}
          hitSlop={10}
          accessibilityLabel="Dismiss notification"
        >
          <X size={16} color={Colors.light.textMuted} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  banner: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderStrong,
    ...Shadows.lg,
    elevation: 8,
  },
  bannerPressed: {
    opacity: 0.95,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.light.textMuted,
    marginLeft: 6,
    fontWeight: '500',
  },
  message: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  closeButton: {
    padding: 6,
    borderRadius: Radius.full,
  },
});
