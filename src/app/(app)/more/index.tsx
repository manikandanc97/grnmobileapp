import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { User, CreditCard, FileText, Bell, Settings, ChevronRight, Boxes, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';

import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SettingsGroup, SettingsRow } from '@/components/ui/SettingsRow';
import { Colors, Spacing, Typography, Radius, Shadows, IconSizes } from '@/constants/theme';

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

  return (
    <ScreenWrapper>
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
            <Text style={styles.profileEmail} numberOfLines={1}>{email}</Text>
            <View style={styles.providerBadge}>
              <Text style={styles.providerText}>
                {provider === 'google' ? 'Google account' : `${provider} account`}
              </Text>
            </View>
          </View>
          <View style={styles.viewProfileContainer}>
            <Text style={styles.viewProfileText}>View Profile</Text>
            <ChevronRight size={IconSizes.sm} color={Colors.light.textMuted} />
          </View>
        </Pressable>

        <SettingsGroup>
          <SettingsRow
            icon={<User size={IconSizes.sm} color={Colors.light.text} />}
            iconBgColor={Colors.light.surfaceMuted}
            title="Profile"
            subtitle="Manage your account"
            onPress={() => router.push('/(app)/more/profile')}
          />
          <SettingsRow
            icon={<CreditCard size={IconSizes.sm} color={Colors.light.warning} />}
            iconBgColor={Colors.light.warningBg}
            title="Expenses"
            subtitle="Track project spending"
            onPress={() => router.push('/(app)/expenses')}
          />
          <SettingsRow
            icon={<Boxes size={IconSizes.sm} color={Colors.light.info} />}
            iconBgColor={Colors.light.infoBg}
            title="Materials (All Sites)"
            subtitle="Global inventory across all projects"
            onPress={() => router.push('/(app)/materials')}
          />
          <SettingsRow
            icon={<Users size={IconSizes.sm} color={Colors.light.primary} />}
            iconBgColor={Colors.light.primaryBg}
            title="Labor (All Sites)"
            subtitle="Global worker logs & rates"
            onPress={() => router.push('/(app)/labor')}
          />
          <SettingsRow
            icon={<FileText size={IconSizes.sm} color={Colors.light.brand} />}
            iconBgColor={Colors.light.brandBg}
            title="Reports"
            subtitle="View project summaries"
            onPress={() => router.push('/(app)/more/reports')}
          />
          <SettingsRow
            icon={<Bell size={IconSizes.sm} color={Colors.light.success} />}
            iconBgColor={Colors.light.successBg}
            title="Notifications"
            subtitle="Stay updated"
            onPress={() => router.push('/(app)/more/notifications')}
          />
          <SettingsRow
            icon={<Settings size={IconSizes.sm} color={Colors.light.textSecondary} />}
            iconBgColor={Colors.light.borderSubtle}
            title="Settings"
            subtitle="App preferences"
            onPress={() => router.push('/(app)/more/settings')}
            hideDivider
          />
        </SettingsGroup>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'] * 2,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  profileCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  profileAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.light.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.primary,
    marginRight: Spacing.md,
    ...Shadows.sm,
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '500',
  },
  providerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  providerText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.brand,
    textTransform: 'capitalize',
    letterSpacing: 0.2,
  },
  viewProfileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewProfileText: {
    fontSize: 12,
    color: Colors.light.brand,
    fontWeight: '700',
    marginRight: 2,
  },
});
