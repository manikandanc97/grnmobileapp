import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  Mail,
  Phone,
  ShieldCheck,
  LogOut,
  X,
} from 'lucide-react-native';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, Typography, Radius, Shadows, IconSizes, TouchTargets } from '@/constants/theme';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ProfileModal({ visible, onClose }: ProfileModalProps) {
  const { session } = useAuth();
  const user = session?.user;

  const rawName = user?.user_metadata?.full_name || user?.user_metadata?.name;
  const email = user?.email || 'No email registered';
  const phone = user?.phone || user?.user_metadata?.phone || 'Not linked';
  const displayName = rawName || (user?.email ? user.email.split('@')[0] : 'Team Member');

  const initials = displayName
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'GR';

  const handleSignOut = async () => {
    onClose();
    await supabase.auth.signOut();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* Header with Close */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Account Profile</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close profile modal"
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed && styles.closeButtonPressed,
                  ]}
                >
                  <X size={IconSizes.sm} color={Colors.light.textSecondary} />
                </Pressable>
              </View>

              {/* Avatar + Main info */}
              <View style={styles.avatarSection}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <Text style={styles.userName}>{displayName}</Text>
                <View style={styles.roleBadge}>
                  <ShieldCheck size={13} color={Colors.light.success} />
                  <Text style={styles.roleText}>Site Supervisor</Text>
                </View>
              </View>

              {/* Details List */}
              <View style={styles.detailsList}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIconWrapper}>
                    <Mail size={IconSizes.sm} color={Colors.light.textSecondary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {email}
                    </Text>
                  </View>
                </View>

                {phone !== 'Not linked' && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailIconWrapper}>
                      <Phone size={IconSizes.sm} color={Colors.light.textSecondary} />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Phone</Text>
                      <Text style={styles.detailValue}>{phone}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Sign Out Action */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign out of account"
                style={({ pressed }) => [
                  styles.signOutButton,
                  pressed && styles.signOutButtonPressed,
                ]}
                onPress={handleSignOut}
              >
                <LogOut size={IconSizes.sm} color={Colors.light.error} />
                <Text style={styles.signOutText}>Sign Out</Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 53, 74, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.light.text,
  },
  closeButton: {
    padding: Spacing.xs,
    borderRadius: Radius.sm,
    minHeight: TouchTargets.min,
    minWidth: TouchTargets.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    backgroundColor: Colors.light.surfaceMuted,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.text,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.light.primary,
    marginBottom: Spacing.sm,
  },
  avatarText: {
    color: Colors.light.surface,
    fontSize: 22,
    fontWeight: '700',
  },
  userName: {
    ...Typography.sectionTitle,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.successBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  roleText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.success,
  },
  detailsList: {
    backgroundColor: Colors.light.background,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
  },
  detailValue: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 1,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.light.errorBg,
    paddingVertical: 13,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#FEE2E2', // Fallback if errorBg border is not defined specifically
    minHeight: TouchTargets.min,
  },
  signOutButtonPressed: {
    backgroundColor: '#FEE2E2',
  },
  signOutText: {
    ...Typography.button,
    color: Colors.light.error,
  },
});
