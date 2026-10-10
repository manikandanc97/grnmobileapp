import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LogOut, User, Mail, Info } from 'lucide-react-native';

import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SettingsGroup, SettingsRow } from '@/components/ui/SettingsRow';
import { Colors, Spacing, Typography, Radius, IconSizes } from '@/constants/theme';

export default function ProfileScreen() {
  const { session } = useAuth();
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <ScreenWrapper>
      <ScreenHeader title="Profile" showBack />
      
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.mainAvatar}>
            <Text style={styles.mainAvatarText}>{initials}</Text>
          </View>
          <Text style={styles.mainName}>{displayName}</Text>
          <Text style={styles.mainEmail}>{email}</Text>
          <View style={styles.providerBadge}>
            <Text style={styles.providerText}>
              {provider === 'google' ? 'Google Authenticated' : `${provider} Authenticated`}
            </Text>
          </View>
        </View>

        <SettingsGroup title="Account">
          <SettingsRow
            icon={<User size={IconSizes.sm} color={Colors.light.textSecondary} />}
            title="Full Name"
            value={displayName}
            showChevron={false}
          />
          <SettingsRow
            icon={<Mail size={IconSizes.sm} color={Colors.light.textSecondary} />}
            title="Email"
            value={email}
            showChevron={false}
            hideDivider
          />
        </SettingsGroup>

        <SettingsGroup title="App">
          <SettingsRow
            icon={<Info size={IconSizes.sm} color={Colors.light.textSecondary} />}
            title="Version"
            value="1.0.0 (Build 57)"
            showChevron={false}
            hideDivider
          />
        </SettingsGroup>

        <SettingsGroup>
          <SettingsRow
            icon={<LogOut size={IconSizes.sm} color={Colors.light.error} />}
            iconBgColor={Colors.light.errorBg}
            title="Sign Out"
            onPress={handleSignOut}
            isDestructive
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
    paddingBottom: Spacing.md,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  mainAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.light.brand,
    marginBottom: Spacing.md,
  },
  mainAvatarText: {
    color: Colors.light.surface,
    ...Typography.display,
  },
  mainName: {
    ...Typography.pageTitle,
    color: Colors.light.text,
    marginBottom: 4,
  },
  mainEmail: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  providerBadge: {
    backgroundColor: Colors.light.surfaceMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  providerText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
});
