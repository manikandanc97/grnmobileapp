import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Bell, Box, Users, CreditCard, CheckCircle2 } from 'lucide-react-native';

import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Spacing, Typography, Radius, Shadows, IconSizes } from '@/constants/theme';

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'material' | 'attendance' | 'expense';
  read: boolean;
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'New material added',
    message: 'Cement was added to Green Villa',
    time: '2 hours ago',
    type: 'material',
    read: false,
  },
  {
    id: '2',
    title: 'Attendance updated',
    message: "Today's labor attendance was completed",
    time: 'Today',
    type: 'attendance',
    read: false,
  },
  {
    id: '3',
    title: 'Expense recorded',
    message: '₹18,500 expense added to Green Villa',
    time: 'Yesterday',
    type: 'expense',
    read: true,
  },
];

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const toggleRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'material':
        return <Box size={IconSizes.sm} color={Colors.light.warning} />;
      case 'attendance':
        return <Users size={IconSizes.sm} color={Colors.light.success} />;
      case 'expense':
        return <CreditCard size={IconSizes.sm} color={Colors.light.primary} />;
      default:
        return <Bell size={IconSizes.sm} color={Colors.light.info} />;
    }
  };

  const getIconBg = (type: string) => {
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

  return (
    <ScreenWrapper>
      <ScreenHeader
        title="Notifications"
        showBack
        actionButton={
          unreadCount > 0 ? (
            <Pressable
              onPress={markAllAsRead}
              style={({ pressed }) => [
                styles.markAllButton,
                pressed && { opacity: 0.7 }
              ]}
              accessibilityRole="button"
              accessibilityLabel="Mark all as read"
            >
              <CheckCircle2 size={IconSizes.sm} color={Colors.light.info} />
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={48} color={Colors.light.textMuted} />}
            title="No notifications yet"
            description="We'll notify you when something important happens."
          />
        ) : (
          notifications.map((notification) => (
            <Pressable
              key={notification.id}
              style={({ pressed }) => [
                styles.notificationCard,
                !notification.read && styles.notificationCardUnread,
                pressed && styles.notificationCardPressed,
              ]}
              onPress={() => toggleRead(notification.id)}
            >
              {!notification.read && <View style={styles.unreadDot} />}
              
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: getIconBg(notification.type) },
                ]}
              >
                {getIcon(notification.type)}
              </View>
              
              <View style={styles.contentContainer}>
                <View style={styles.contentHeader}>
                  <Text
                    style={[
                      styles.title,
                      !notification.read && styles.titleUnread,
                    ]}
                  >
                    {notification.title}
                  </Text>
                  <Text style={styles.time}>{notification.time}</Text>
                </View>
                <Text style={styles.message}>{notification.message}</Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: Spacing.sm,
  },
  markAllText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.info,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'] * 2,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  notificationCardUnread: {
    backgroundColor: Colors.light.infoBg,
    borderColor: Colors.light.border,
  },
  notificationCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  unreadDot: {
    position: 'absolute',
    top: Spacing.md,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.info,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginLeft: 4,
  },
  contentContainer: {
    flex: 1,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    ...Typography.body,
    fontWeight: '500',
    color: Colors.light.textSecondary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  titleUnread: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  time: {
    ...Typography.caption,
    color: Colors.light.textMuted,
  },
  message: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
});
