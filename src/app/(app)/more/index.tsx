import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { User, CreditCard, FileText, Bell, Settings, ChevronRight } from 'lucide-react-native';
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
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  profileCardPressed: {
    backgroundColor: Colors.light.surfaceMuted,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.brand,
    marginRight: Spacing.md,
  },
  profileAvatarText: {
    color: Colors.light.surface,
    ...Typography.sectionTitle,
  },
  profileInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  profileName: {
    ...Typography.cardTitle,
    color: Colors.light.text,
    marginBottom: 2,
  },
  profileEmail: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
  },
  providerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.surfaceMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  providerText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'capitalize',
  },
  viewProfileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewProfileText: {
    ...Typography.caption,
    color: Colors.light.text,
    fontWeight: '600',
    marginRight: 2,
  },
});
