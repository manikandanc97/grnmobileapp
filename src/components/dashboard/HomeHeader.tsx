import React from 'react';
import { View, StyleSheet, Pressable, Image, Text } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { useNotifications } from '@/hooks/useNotifications';
import { Colors, Spacing, Radius } from '@/constants/theme';

interface Props { onProfilePress?: () => void; onNotificationPress?: () => void }
export function HomeHeader({ onProfilePress, onNotificationPress }: Props) {
  const router = useRouter();
  const { session } = useAuth();
  const { unreadCount } = useNotifications();
  const user = session?.user;
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || (user?.email ? user.email.split('@')[0] : 'Team Member');
  const initials = name.split(' ').filter(Boolean).map((word: string) => word[0]).join('').slice(0, 2).toUpperCase();
  const avatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  return (
    <View style={styles.header}>
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>{name}</Text>
        <Text style={styles.role}>Site Engineer</Text>
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Notifications, ${unreadCount} unread`} onPress={onNotificationPress ?? (() => router.push('/(app)/more/notifications'))} style={({ pressed }) => [styles.control, pressed && styles.pressed]}>
          <Bell size={20} color={Colors.light.brand} strokeWidth={1.8} />
          {unreadCount > 0 && <View style={styles.dot} />}
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Open your profile" onPress={onProfilePress ?? (() => router.push('/(app)/more/profile'))} style={({ pressed }) => [styles.control, styles.avatar, pressed && styles.pressed]}>
          {avatar ? <Image source={{ uri: avatar }} style={styles.photo} /> : <Text style={styles.initials}>{initials}</Text>}
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: 12, backgroundColor: Colors.light.background },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 18, lineHeight: 24, fontWeight: '700', color: Colors.light.text },
  role: { fontSize: 13, lineHeight: 18, fontWeight: '500', color: Colors.light.textSecondary },
  actions: { flexDirection: 'row', gap: 8 },
  control: { width: 44, height: 44, borderRadius: Radius.md, backgroundColor: Colors.light.surface, borderWidth: 1, borderColor: Colors.light.border, alignItems: 'center', justifyContent: 'center' },
  avatar: { backgroundColor: Colors.light.brandBg },
  photo: { width: '100%', height: '100%', borderRadius: Radius.md },
  initials: { fontSize: 13, fontWeight: '600', color: Colors.light.brand },
  dot: { position: 'absolute', right: 10, top: 9, width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.light.accent },
  pressed: { opacity: 0.7 },
});
