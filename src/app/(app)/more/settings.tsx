import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { Bell, Moon, Globe, Info, Shield, FileText, LogOut, Lock, Fingerprint, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAppLock } from '@/providers/AppLockProvider';
import { AutoLockTimeout, appLockService } from '@/services/appLock';

import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SettingsGroup, SettingsRow } from '@/components/ui/SettingsRow';
import { Colors, Spacing, IconSizes } from '@/constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings: lockSettings, updateSettings } = useAppLock();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [theme, setTheme] = useState('System');
  const [language, setLanguage] = useState('English');
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);

  useEffect(() => {
    appLockService.isBiometricAvailable().then(setIsBiometricAvailable);
  }, []);

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

  const toggleAppLock = async (enabled: boolean) => {
    if (enabled && !isBiometricAvailable) {
      Alert.alert('Unavailable', 'Device biometrics must be configured to use App Lock.');
      return;
    }
    
    if (enabled) {
      const result = await appLockService.authenticate();
      if (!result.success) {
        Alert.alert('Authentication Failed', 'You must authenticate to enable App Lock.');
        return;
      }
    }
    
    await updateSettings({ enabled });
  };

  const toggleBiometric = async (biometric: boolean) => {
    await updateSettings({ biometric });
  };

  const changeAutoLock = () => {
    const options: AutoLockTimeout[] = ['Immediately', '1 min', '5 min', '15 min'];
    const currentIndex = options.indexOf(lockSettings.timeout);
    const nextIndex = (currentIndex + 1) % options.length;
    updateSettings({ timeout: options[nextIndex] });
  };

  return (
    <ScreenWrapper>
      <ScreenHeader title="Settings" showBack />
      
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SettingsGroup title="Security">
          <SettingsRow
            icon={<Lock size={IconSizes.sm} color={Colors.light.brand} />}
            iconBgColor={Colors.light.brand + '20'}
            title="App Lock"
            value={
              <Switch
                value={lockSettings.enabled}
                onValueChange={toggleAppLock}
                trackColor={{ false: Colors.light.border, true: Colors.light.brand }}
                thumbColor={Colors.light.surface}
              />
            }
            showChevron={false}
          />
          {lockSettings.enabled && (
            <>
              <SettingsRow
                icon={<Fingerprint size={IconSizes.sm} color={Colors.light.primary} />}
                iconBgColor={Colors.light.primaryBg}
                title="Biometric Authentication"
                value={
                  <Switch
                    value={lockSettings.biometric}
                    onValueChange={toggleBiometric}
                    trackColor={{ false: Colors.light.border, true: Colors.light.brand }}
                    thumbColor={Colors.light.surface}
                  />
                }
                showChevron={false}
              />
              <SettingsRow
                icon={<Clock size={IconSizes.sm} color={Colors.light.warning} />}
                iconBgColor={Colors.light.warningBg}
                title="Auto Lock"
                value={lockSettings.timeout}
                onPress={changeAutoLock}
                hideDivider
              />
            </>
          )}
        </SettingsGroup>

        <SettingsGroup title="General">
          <SettingsRow
            icon={<Bell size={IconSizes.sm} color={Colors.light.info} />}
            iconBgColor={Colors.light.infoBg}
            title="Notifications"
            value={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: Colors.light.border, true: Colors.light.brand }}
                thumbColor={Colors.light.surface}
              />
            }
            showChevron={false}
          />
          <SettingsRow
            icon={<Moon size={IconSizes.sm} color={Colors.light.primary} />}
            iconBgColor={Colors.light.primaryBg}
            title="Appearance"
            value={theme}
            onPress={toggleTheme}
          />
          <SettingsRow
            icon={<Globe size={IconSizes.sm} color={Colors.light.warning} />}
            iconBgColor={Colors.light.warningBg}
            title="Language"
            value={language}
            onPress={toggleLanguage}
            hideDivider
          />
        </SettingsGroup>

        <SettingsGroup title="App">
          <SettingsRow
            icon={<Info size={IconSizes.sm} color={Colors.light.textSecondary} />}
            iconBgColor={Colors.light.surfaceMuted}
            title="About GRN Construction"
            onPress={() => router.push('/(app)/more/about' as any)}
          />
          <SettingsRow
            icon={<Shield size={IconSizes.sm} color={Colors.light.success} />}
            iconBgColor={Colors.light.successBg}
            title="Privacy Policy"
            onPress={() => {}}
          />
          <SettingsRow
            icon={<FileText size={IconSizes.sm} color={Colors.light.info} />}
            iconBgColor={Colors.light.infoBg}
            title="Terms of Service"
            onPress={() => {}}
            hideDivider
          />
        </SettingsGroup>

        <SettingsGroup title="Account">
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
    paddingBottom: Spacing['2xl'] * 2,
  },
});
