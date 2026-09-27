import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  actionButton?: React.ReactNode;
  showBorder?: boolean;
  showBack?: boolean;
}

export function ScreenHeader({ title, subtitle, actionButton, showBorder = true, showBack = false }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View style={[styles.header, showBorder && styles.headerBorder]}>
      {showBack && (
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#0F354A" />
        </Pressable>
      )}
      <View style={styles.headerTextContainer}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
      {actionButton && (
        <View style={styles.actionContainer}>
          {actionButton}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  headerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F354A',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7A85',
    fontWeight: '500',
  },
  actionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 2,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
    marginTop: 2,
  },
  backButtonPressed: {
    opacity: 0.5,
  },
});
