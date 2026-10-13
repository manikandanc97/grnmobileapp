import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Bell, Settings, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SettingsGroup, SettingsRow } from '@/components/ui/SettingsRow';
import { Colors, Spacing, Radius, IconSizes } from '@/constants/theme';

export default function MoreScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const user = session?.user;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || (user?.email ? user.email.split('@')[0] : 'Team Member');
  const initials = displayName.split(' ').map((part: string) => part[0]).join('').slice(0, 2).toUpperCase() || 'GR';
  return (
    <ScreenWrapper>
      <ScreenHeader title="More" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsGroup title="Account">
          <Pressable accessibilityRole="button" accessibilityLabel="View profile" onPress={() => router.push('/(app)/more/profile')} style={({ pressed }) => [styles.profile, pressed && styles.pressed]}>
            <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View>
            <View style={styles.info}><Text style={styles.name} numberOfLines={1}>{displayName}</Text><Text style={styles.subtitle}>View profile</Text></View>
            <ChevronRight size={18} color={Colors.light.textSecondary} />
          </Pressable>
          <SettingsRow icon={<Bell size={IconSizes.md} color={Colors.light.brand} />} title="Notifications" onPress={() => router.push('/(app)/more/notifications')} />
          <SettingsRow icon={<Settings size={IconSizes.md} color={Colors.light.brand} />} title="Settings" subtitle="Security and sign out" onPress={() => router.push('/(app)/more/settings')} hideDivider />
        </SettingsGroup>
      </ScrollView>
    </ScreenWrapper>
  );
}
const styles = StyleSheet.create({
  content: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  avatar: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.light.brandBg, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 16, fontWeight: '700', color: Colors.light.brand },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: Colors.light.text },
  subtitle: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 4 },
  pressed: { backgroundColor: Colors.light.surfaceMuted },
});
