import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Construction } from 'lucide-react-native';

interface TabPlaceholderScreenProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export function TabPlaceholderScreen({
  title,
  description,
  icon,
}: TabPlaceholderScreenProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.webContainer}>
        {/* Top Header */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Home"
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed,
            ]}
            onPress={() => router.push('/(app)')}
          >
            <ArrowLeft size={20} color="#0F354A" />
          </Pressable>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            {icon || <Construction size={36} color="#D97706" />}
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>Phase 2 Feature</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Return to Dashboard"
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => router.push('/(app)')}
          >
            <Text style={styles.actionButtonText}>Return to Dashboard</Text>
          </Pressable>
        </View>
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
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
  },
  backButtonPressed: {
    backgroundColor: '#E8ECEF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F354A',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F354A',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#6B7A85',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  badge: {
    backgroundColor: '#EEF2F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 28,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F354A',
  },
  actionButton: {
    backgroundColor: '#0F354A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
