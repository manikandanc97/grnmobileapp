import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import {
  ArrowLeft,
  Bell,
  Moon,
  Globe,
  Info,
  Shield,
  FileText,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function SettingsScreen() {
  const router = useRouter();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [theme, setTheme] = useState('System');
  const [language, setLanguage] = useState('English');

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const toggleTheme = () => {
    if (theme === 'System') setTheme('Light');
    else if (theme === 'Light') setTheme('Dark');
    else setTheme('System');
  };

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'English' ? 'Tamil' : 'English'));
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
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* GENERAL SECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>General</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: '#F0F9FF' }]}>
                    <Bell size={20} color="#0EA5E9" />
                  </View>
                  <Text style={styles.rowText}>Notifications</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#E2E8F0', true: '#F2A619' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <View style={styles.divider} />
              
              <Pressable style={styles.row} onPress={toggleTheme}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
                    <Moon size={20} color="#9333EA" />
                  </View>
                  <Text style={styles.rowText}>Appearance</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.valueText}>{theme}</Text>
                  <ChevronRight size={18} color="#8A99A4" />
                </View>
              </Pressable>
              <View style={styles.divider} />

              <Pressable style={styles.row} onPress={toggleLanguage}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                    <Globe size={20} color="#D97706" />
                  </View>
                  <Text style={styles.rowText}>Language</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.valueText}>{language}</Text>
                  <ChevronRight size={18} color="#8A99A4" />
                </View>
              </Pressable>
            </View>
          </View>

          {/* APP SECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>App</Text>
            <View style={styles.card}>
              <Pressable
                style={styles.row}
                onPress={() => router.push('/(app)/more/about' as any)}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: '#F3F4F6' }]}>
                    <Info size={20} color="#4B5563" />
                  </View>
                  <Text style={styles.rowText}>About GRN Construction</Text>
                </View>
                <ChevronRight size={18} color="#8A99A4" />
              </Pressable>
              <View style={styles.divider} />

              <Pressable style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
                    <Shield size={20} color="#059669" />
                  </View>
                  <Text style={styles.rowText}>Privacy Policy</Text>
                </View>
                <ChevronRight size={18} color="#8A99A4" />
              </Pressable>
              <View style={styles.divider} />

              <Pressable style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
                    <FileText size={20} color="#2563EB" />
                  </View>
                  <Text style={styles.rowText}>Terms of Service</Text>
                </View>
                <ChevronRight size={18} color="#8A99A4" />
              </Pressable>
            </View>
          </View>

          {/* ACCOUNT SECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Account</Text>
            <Pressable
              style={({ pressed }) => [
                styles.signOutButton,
                pressed && styles.signOutButtonPressed,
              ]}
              onPress={handleSignOut}
            >
              <LogOut size={20} color="#DC2626" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </View>

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
    justifyContent: 'space-between',
    padding: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rowText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0F354A',
  },
  valueText: {
    fontSize: 14,
    color: '#6B7A85',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF2F6',
    marginLeft: 68,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  signOutButtonPressed: {
    backgroundColor: '#FEF2F2',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
});
