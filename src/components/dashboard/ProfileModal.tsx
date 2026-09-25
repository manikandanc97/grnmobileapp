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
                  <X size={18} color="#6B7A85" />
                </Pressable>
              </View>

              {/* Avatar + Main info */}
              <View style={styles.avatarSection}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <Text style={styles.userName}>{displayName}</Text>
                <View style={styles.roleBadge}>
                  <ShieldCheck size={13} color="#059669" />
                  <Text style={styles.roleText}>Site Supervisor</Text>
                </View>
              </View>

              {/* Details List */}
              <View style={styles.detailsList}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIconWrapper}>
                    <Mail size={16} color="#6B7A85" />
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
                      <Phone size={16} color="#6B7A85" />
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
                <LogOut size={18} color="#DC2626" />
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
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#0F354A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F354A',
  },
  closeButton: {
    padding: 4,
    borderRadius: 8,
  },
  closeButtonPressed: {
    backgroundColor: '#F3F6F8',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0F354A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F2A619',
    marginBottom: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F354A',
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  detailsList: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8ECEF',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8A99A4',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A2B35',
    marginTop: 1,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  signOutButtonPressed: {
    backgroundColor: '#FEE2E2',
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
});
