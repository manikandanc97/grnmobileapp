import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
} from 'react-native';
import {
  ArrowLeft,
  Bell,
  Box,
  Users,
  CreditCard,
  CheckCircle2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

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
  const router = useRouter();
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
        return <Box size={20} color="#D97706" />;
      case 'attendance':
        return <Users size={20} color="#059669" />;
      case 'expense':
        return <CreditCard size={20} color="#9333EA" />;
      default:
        return <Bell size={20} color="#0EA5E9" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'material':
        return '#FEF3C7';
      case 'attendance':
        return '#ECFDF5';
      case 'expense':
        return '#F3E8FF';
      default:
        return '#F0F9FF';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.webContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color="#0F354A" />
            </Pressable>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 && (
            <Pressable
              onPress={markAllAsRead}
              style={styles.markAllButton}
            >
              <CheckCircle2 size={16} color="#0EA5E9" />
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          )}
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                We&apos;ll notify you when something important happens.
              </Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <Pressable
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.notificationCardUnread,
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  webContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F354A',
    marginLeft: 4,
  },
  badge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8ECEF',
    position: 'relative',
    overflow: 'hidden',
  },
  notificationCardUnread: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    left: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0EA5E9',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
    marginRight: 8,
  },
  titleUnread: {
    color: '#0F354A',
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    color: '#94A3B8',
  },
  message: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F354A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7A85',
    textAlign: 'center',
    maxWidth: '80%',
  },
});
