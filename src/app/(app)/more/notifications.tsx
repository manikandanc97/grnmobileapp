import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  Bell,
  Box,
  Users,
  IndianRupee,
  CheckCircle2,
  Trash2,
  Activity,
  Layers,
} from 'lucide-react-native';
import { formatDistanceToNow, isValid, parseISO } from 'date-fns';

import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors, Spacing, Typography, Radius, Shadows, IconSizes } from '@/constants/theme';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType, NotificationItem } from '@/services/notifications';

type FilterType = 'all' | 'unread' | 'material' | 'expense' | 'attendance';

export default function NotificationsScreen() {
  const {
    notifications,
    unreadCount,
    loading,
    refreshing,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeFilter === 'unread') return !item.read;
      if (activeFilter === 'material') return item.type === 'material';
      if (activeFilter === 'expense') return item.type === 'expense';
      if (activeFilter === 'attendance') return item.type === 'attendance';
      return true;
    });
  }, [notifications, activeFilter]);

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const date = parseISO(isoString);
      if (!isValid(date)) return 'Recent';
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Recent';
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'material':
        return <Box size={IconSizes.sm} color={Colors.light.warning} />;
      case 'attendance':
        return <Users size={IconSizes.sm} color={Colors.light.success} />;
      case 'expense':
        return <IndianRupee size={IconSizes.sm} color={Colors.light.primary} />;
      case 'progress':
        return <Activity size={IconSizes.sm} color={Colors.light.info} />;
      default:
        return <Bell size={IconSizes.sm} color={Colors.light.info} />;
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
                pressed && { opacity: 0.7 },
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

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <Pressable
            style={[
              styles.filterChip,
              activeFilter === 'all' && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter('all')}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === 'all' && styles.filterTextActive,
              ]}
            >
              All ({notifications.length})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterChip,
              activeFilter === 'unread' && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter('unread')}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === 'unread' && styles.filterTextActive,
              ]}
            >
              Unread ({unreadCount})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterChip,
              activeFilter === 'expense' && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter('expense')}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === 'expense' && styles.filterTextActive,
              ]}
            >
              Expenses
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterChip,
              activeFilter === 'material' && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter('material')}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === 'material' && styles.filterTextActive,
              ]}
            >
              Materials
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterChip,
              activeFilter === 'attendance' && styles.filterChipActive,
            ]}
            onPress={() => setActiveFilter('attendance')}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === 'attendance' && styles.filterTextActive,
              ]}
            >
              Attendance
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetch}
            colors={[Colors.light.primary]}
            tintColor={Colors.light.primary}
          />
        }
      >
        {loading && notifications.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={48} color={Colors.light.textMuted} />}
            title={activeFilter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            description={
              activeFilter === 'unread'
                ? 'You are all caught up! Any new updates will appear here in real-time.'
                : "We'll notify you automatically when new materials, expenses, or site updates are added."
            }
          />
        ) : (
          filteredNotifications.map((notification: NotificationItem) => (
            <Pressable
              key={notification.id}
              style={({ pressed }) => [
                styles.notificationCard,
                !notification.read && styles.notificationCardUnread,
                pressed && styles.notificationCardPressed,
              ]}
              onPress={() => {
                if (!notification.read) {
                  markAsRead(notification.id);
                }
              }}
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
                    numberOfLines={1}
                  >
                    {notification.title}
                  </Text>
                  <Text style={styles.time}>
                    {formatRelativeTime(notification.created_at)}
                  </Text>
                </View>

                <Text style={styles.message}>{notification.message}</Text>

                {Boolean(notification.site_name) && (
                  <View style={styles.siteBadge}>
                    <Layers size={11} color={Colors.light.textMuted} />
                    <Text style={styles.siteBadgeText}>
                      {notification.site_name}
                    </Text>
                  </View>
                )}
              </View>

              <Pressable
                style={styles.deleteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                hitSlop={10}
                accessibilityLabel="Delete notification"
              >
                <Trash2 size={15} color={Colors.light.textMuted} />
              </Pressable>
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
  filterBar: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterChipActive: {
    backgroundColor: Colors.light.brandBg,
    borderColor: Colors.light.info,
  },
  filterText: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: Colors.light.info,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginTop: 12,
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
    alignItems: 'flex-start',
  },
  notificationCardUnread: {
    backgroundColor: Colors.light.infoBg,
    borderColor: 'rgba(37, 99, 235, 0.25)',
  },
  notificationCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    left: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.info,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginLeft: 4,
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    lineHeight: 19,
  },
  siteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  siteBadgeText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  deleteButton: {
    padding: 6,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
});
