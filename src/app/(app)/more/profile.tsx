import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { LogOut, User, Mail, Info } from 'lucide-react-native';

import { useAuth } from '@/providers/AuthProvider';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SettingsGroup, SettingsRow } from '@/components/ui/SettingsRow';
import { SignOutConfirmDialog } from '@/components/auth/SignOutConfirmDialog';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { toast } from '@/lib/toast';
import { Colors, Spacing, Typography, Radius, IconSizes, Shadows } from '@/constants/theme';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showNameEditor, setShowNameEditor] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
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

  const handleConfirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      setShowSignOutConfirm(false);
    } catch {
      setIsSigningOut(false);
    }
  };

  const openNameEditor = () => {
    setNameInput(displayName);
    setShowNameEditor(true);
  };

  const handleSaveName = async () => {
    const fullName = nameInput.trim().replace(/\s+/g, ' ');
    if (!fullName) {
      toast.error('Name required', 'Enter your full name to continue.');
      return;
    }

    setIsSavingName(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, name: fullName },
    });
    setIsSavingName(false);

    if (error) {
      toast.error('Unable to update name', error.message);
      return;
    }

    setShowNameEditor(false);
    toast.success('Name updated');
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
            onPress={openNameEditor}
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
            value="1.0.0"
            showChevron={false}
            hideDivider
          />
        </SettingsGroup>

        <SettingsGroup>
          <SettingsRow
            icon={<LogOut size={IconSizes.sm} color={Colors.light.error} />}
            iconBgColor={Colors.light.errorBg}
            title="Sign Out"
            onPress={() => setShowSignOutConfirm(true)}
            isDestructive
            hideDivider
          />
        </SettingsGroup>
      </ScrollView>

      <SignOutConfirmDialog
        visible={showSignOutConfirm}
        userName={displayName}
        userEmail={user?.email}
        loading={isSigningOut}
        onConfirm={handleConfirmSignOut}
        onCancel={() => setShowSignOutConfirm(false)}
      />

      <Modal
        visible={showNameEditor}
        transparent
        animationType="fade"
        onRequestClose={() => !isSavingName && setShowNameEditor(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => !isSavingName && setShowNameEditor(false)}
          >
            <Pressable style={styles.editorCard} onPress={(event) => event.stopPropagation()}>
              <Text style={styles.editorTitle}>Edit name</Text>
              <Text style={styles.editorHint}>This name will appear on your home page and profile.</Text>
              <TextField
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Full name"
                autoCapitalize="words"
                autoCorrect={false}
                autoFocus
                maxLength={60}
                editable={!isSavingName}
                onSubmitEditing={handleSaveName}
              />
              <View style={styles.editorActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowNameEditor(false)}
                  disabled={isSavingName}
                  style={styles.editorButton}
                />
                <Button
                  title="Save"
                  onPress={handleSaveName}
                  loading={isSavingName}
                  disabled={!nameInput.trim() || nameInput.trim() === displayName}
                  style={styles.editorButton}
                />
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
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
    backgroundColor: Colors.light.brandBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.md,
  },
  mainAvatarText: {
    color: Colors.light.brand,
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
  modalRoot: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.light.backdrop,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  editorCard: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  editorTitle: {
    ...Typography.sectionTitle,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  editorHint: {
    ...Typography.secondary,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  editorActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  editorButton: {
    flex: 1,
  },
});
