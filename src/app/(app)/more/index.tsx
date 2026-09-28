import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import {
  User,
  CreditCard,
  FileText,
  Bell,
  Settings,
  ChevronRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

export default function MoreScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const user = session?.user;

  const rawName = user?.user_metadata?.full_name || user?.user_metadata?.name;
  const email = user?.email || 'Authenticated User';
  const displayName = rawName || (user?.email ? user.email.split('@')[0] : 'Team Member');
  const provider = user?.app_metadata?.provider || 'Email';

  const initials = displayName
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'GR';

  const menuItems = [
    {
      icon: <User size={20} color="#0F354A" />,
      title: 'Profile',
      description: 'Manage your account',
      route: '/(app)/more/profile',
      bgColor: '#E2E8F0',
    },
    {
      icon: <CreditCard size={20} color="#9333EA" />,
      title: 'Expenses',
      description: 'Track project spending',
      route: '/(app)/expenses',
      bgColor: '#F3E8FF',
    },
    {
      icon: <FileText size={20} color="#D97706" />,
      title: 'Reports',
      description: 'View project summaries',
      route: '/(app)/more/reports',
      bgColor: '#FEF3C7',
    },
    {
      icon: <Bell size={20} color="#059669" />,
      title: 'Notifications',
      description: 'Stay updated',
      route: '/(app)/more/notifications',
      bgColor: '#ECFDF5',
    },
    {
      icon: <Settings size={20} color="#4B5563" />,
      title: 'Settings',
      description: 'App preferences',
      route: '/(app)/more/settings',
      bgColor: '#F3F4F6',
    },
  ];

  return (
    <ScreenWrapper>
      <View style={styles.webContainer}>
        {/* Header */}
        <ScreenHeader
          title="More"
          subtitle="Manage your account and app"
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* User Profile Card */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View profile details"
            style={({ pressed }) => [
              styles.profileCard,
              pressed && styles.profileCardPressed,
            ]}
            onPress={() => router.push('/(app)/more/profile' as any)}
          >
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {email}
              </Text>
              <View style={styles.providerBadge}>
                <Text style={styles.providerText}>
                  {provider === 'google' ? 'Google account' : `${provider} account`}
                </Text>
              </View>
            </View>
            <View style={styles.viewProfileContainer}>
              <Text style={styles.viewProfileText}>View Profile</Text>
              <ChevronRight size={16} color="#8A99A4" />
            </View>
          </Pressable>

          {/* Quick Menu */}
          <View style={styles.menuGroup}>
            {menuItems.map((item, index) => (
              <React.Fragment key={item.title}>
                <Pressable
                  style={({ pressed }) => [
                    styles.menuItem,
                    pressed && styles.menuItemPressed,
                  ]}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={[styles.menuIcon, { backgroundColor: item.bgColor }]}>
                    {item.icon}
                  </View>
                  <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    <Text style={styles.menuSubtitle}>{item.description}</Text>
                  </View>
                  <ChevronRight size={18} color="#8A99A4" />
                </Pressable>
                {index < menuItems.length - 1 && <View style={styles.menuItemDivider} />}
              </React.Fragment>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F354A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6B7A85',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECEF',
    marginBottom: 24,
    shadowColor: '#0F354A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  profileCardPressed: {
    backgroundColor: '#FAFCFD',
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0F354A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F2A619',
    marginRight: 16,
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    paddingRight: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F354A',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7A85',
    marginBottom: 6,
  },
  providerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  providerText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    textTransform: 'capitalize',
  },
  viewProfileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewProfileText: {
    fontSize: 13,
    color: '#0F354A',
    fontWeight: '600',
    marginRight: 2,
  },
  menuGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECEF',
    overflow: 'hidden',
    shadowColor: '#0F354A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  menuItemPressed: {
    backgroundColor: '#FAFCFD',
  },
  menuItemDivider: {
    height: 1,
    backgroundColor: '#F3F6F8',
    marginLeft: 64,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F354A',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#6B7A85',
  },
});
