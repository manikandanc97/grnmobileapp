import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
} from 'react-native';
import { LogOut, ArrowLeft, User, Mail, Info } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.webContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#0F354A" />
          </Pressable>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>

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

          {/* Account Details */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Account</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.iconContainer}>
                  <User size={20} color="#6B7A85" />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Full Name</Text>
                  <Text style={styles.rowValue}>{displayName}</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <View style={styles.iconContainer}>
                  <Mail size={20} color="#6B7A85" />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Email</Text>
                  <Text style={styles.rowValue}>{email}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* App Details */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>App</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.iconContainer}>
                  <Info size={20} color="#6B7A85" />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>Version</Text>
                  <Text style={styles.rowValue}>1.0.0 (Build 57)</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Sign Out */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign Out"
            style={({ pressed }) => [
              styles.signOutButton,
              pressed && styles.signOutButtonPressed,
            ]}
            onPress={handleSignOut}
          >
            <LogOut size={18} color="#DC2626" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
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
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F354A',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  mainAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#0F354A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F2A619',
    marginBottom: 16,
  },
  mainAvatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  mainName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F354A',
    marginBottom: 4,
  },
  mainEmail: {
    fontSize: 15,
    color: '#6B7A85',
    marginBottom: 12,
  },
  providerBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  providerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A99A4',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECEF',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF2F6',
    marginLeft: 52,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 12,
    color: '#8A99A4',
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F354A',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: 16,
  },
  signOutButtonPressed: {
    backgroundColor: '#FEE2E2',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
  },
});
