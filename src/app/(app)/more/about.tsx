import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BrandMark } from '@/components/brand/BrandMark';

import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Colors, Spacing, Typography, Radius, Shadows } from '@/constants/theme';

export default function AboutScreen() {
  return (
    <ScreenWrapper>
      <ScreenHeader title="About" showBack />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <BrandMark size={80} showName={false} />
          </View>
          <Text style={styles.brandName}>GRN</Text>
          <Text style={styles.tagline}>Construction management made simple.</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        <Text style={styles.tagline}>
          Record site materials, daily attendance, expenses and cash transactions. Open a site to view its daily summary and budget.
        </Text>

        <Text style={styles.copyright}>
          © {new Date().getFullYear()} GRN Constructions Pvt. Ltd.{'\n'}
          All rights reserved.
        </Text>
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
    paddingBottom: Spacing.md,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: Radius.lg,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.borderSubtle,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  brandName: {
    ...Typography.pageTitle,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  tagline: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  versionBadge: {
    backgroundColor: Colors.light.surfaceMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  versionText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  copyright: {
    ...Typography.caption,
    textAlign: 'center',
    color: Colors.light.textMuted,
    lineHeight: 20,
    marginTop: Spacing.xl,
  },
});
